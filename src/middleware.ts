import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/dashboard");

  let hasAccess = false;
  if (user && isAdminRoute) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();
      
    hasAccess = userProfile?.is_admin === true || userProfile?.role === "supervisor" || userProfile?.role === "admin";
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && pathname !== "/login" && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAdminRoute && !hasAccess) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/dashboard" : "/login", request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
