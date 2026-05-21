import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Simple in-memory rate limiter (per Edge isolate)
const rateLimitMap = new Map<string, { count: number; expires: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 600; // 600 requests per minute per IP (increased to prevent dev blocks)
  
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
  if (pathname.startsWith("/api/") && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    if (host) {
      const isValidOrigin = origin && new URL(origin).host === host;
      const isValidReferer = referer && new URL(referer).host === host;
      
      if (!isValidOrigin && !isValidReferer) {
        return NextResponse.json({ error: "CSRF token mismatch or invalid origin" }, { status: 403 });
      }
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
