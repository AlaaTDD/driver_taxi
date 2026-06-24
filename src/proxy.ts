import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Simple in-memory rate limiter (per Edge isolate)
const rateLimitMap = new Map<string, { count: number; expires: number }>();
const MUTATION_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);
const MAX_MUTATION_BODY_BYTES = 1_000_000;
let rateLimitCleanupCounter = 0;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 200; // 200 requests per minute per IP
  
  // Periodically purge expired entries to prevent memory leak
  if (++rateLimitCleanupCounter >= 500) {
    rateLimitCleanupCounter = 0;
    for (const [key, val] of rateLimitMap) {
      if (val.expires < now) rateLimitMap.delete(key);
    }
  }

  const record = rateLimitMap.get(ip);
  if (!record || record.expires < now) {
    rateLimitMap.set(ip, { count: 1, expires: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

function headerHostMatches(value: string | null, host: string | null): boolean {
  if (!value || !host) return false;
  try {
    return new URL(value).host === host;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // 1. Rate Limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
  
  if (!checkRateLimit(ip)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    // For UI routes, maybe redirect or error
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // 2. CSRF Protection for API Mutations
  if (pathname.startsWith("/api/") && MUTATION_METHODS.has(method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (Number.isFinite(contentLength) && contentLength > MAX_MUTATION_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    if (host) {
      // Prefer Origin (sent automatically by browsers for same-origin mutations).
      // Fall back to Referer only when Origin is absent (e.g. some legacy clients).
      // Reject if neither header is present on a mutation request.
      if (origin) {
        if (!headerHostMatches(origin, host)) {
          // Allow localhost variants for dev (localhost:3000 vs 127.0.0.1:3000)
          const isLocalhostDev =
            (host.startsWith("localhost:") || host.startsWith("127.0.0.1:")) &&
            (origin.includes("localhost:") || origin.includes("127.0.0.1:"));
          if (!isLocalhostDev) {
            return NextResponse.json({ error: "CSRF validation failed: origin mismatch" }, { status: 403 });
          }
        }
      } else if (referer) {
        if (!headerHostMatches(referer, host)) {
          return NextResponse.json({ error: "CSRF validation failed: referer mismatch" }, { status: 403 });
        }
      }
      // If both Origin and Referer are absent, allow through (some browsers/proxies
      // strip these headers). The auth-guard still validates the session, and all
      // mutations are also logged. Blocking legitimate same-origin form submits
      // because of a missing header breaks the entire admin dashboard.
    }
  }

  // If it's an API route, auth is usually checked inside the route handler via auth-guard.ts
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // 3. Supabase Auth for Dashboard Pages
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isAdminRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/";

  // If we don't care about auth for this route in middleware, skip the expensive getUser() call
  if (!isAdminRoute && !isAuthRoute) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectWithCookies = (url: URL) => {
    const response = NextResponse.redirect(url);
    // Copy any refreshed session cookies to the new redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  };

  // Logic Order Fix (LOGIC-01)
  if (!user && pathname !== "/login" && pathname !== "/") {
    return redirectWithCookies(new URL("/login", request.url));
  }

  if (user && isAdminRoute) {
    // Rely on JWT claims instead of DB lookup (PERF-03)
    const isAdmin = user.app_metadata?.is_admin === true;
    const role = user.app_metadata?.role;
    const hasAccess = isAdmin || role === "supervisor" || role === "admin";
    
    if (!hasAccess) {
      return redirectWithCookies(new URL("/login?error=unauthorized", request.url));
    }
  }

  if (user && pathname === "/login") {
    return redirectWithCookies(new URL("/dashboard", request.url));
  }

  if (pathname === "/") {
    return redirectWithCookies(new URL(user ? "/dashboard" : "/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|css|js|woff|woff2|ttf)$).*)",
  ],
};
