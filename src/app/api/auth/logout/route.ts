import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  // Clear all auth cookies
  const cookies = request.cookies.getAll();
  cookies.forEach((cookie) => {
    if (cookie.name.includes("supabase")) {
      response.cookies.delete(cookie.name);
    }
  });

  return response;
}
