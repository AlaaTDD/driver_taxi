import { createClient } from "./server";
import { NextResponse } from "next/server";

/**
 * Validates that the incoming API request is from an authenticated admin user.
 * Returns the authenticated user object if valid, or a 401/403 Response if not.
 *
 * Usage in any API route:
 *   const guard = await requireAdmin(request);
 *   if (guard instanceof Response) return guard;
 *   // guard is { user, email }
 */
export async function requireAdmin(request?: Request): Promise<
  { user: { id: string; email?: string }; email: string } | Response
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: "Unauthorized: not authenticated" },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 }
      );
    }

    return { user, email: user.email || "admin" };
  } catch (error) {
    console.error("Auth Guard Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Failed to communicate with Auth service" },
      { status: 500 }
    );
  }
}
