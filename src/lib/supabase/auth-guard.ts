import { createClient } from "./server";
import { NextResponse } from "next/server";

/**
 * Validates that the incoming API request is from an authenticated admin user.
 * Returns the authenticated user object if valid, or a 401/403 Response if not.
 *
 * Usage in any API route:
 *   const guard = await requireAdmin();
 *   if (guard instanceof Response) return guard;
 *   // guard is { user, email }
 */
export async function requireAdmin(): Promise<
  { user: { id: string; email?: string }; email: string } | Response
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claimIsAdmin = user.app_metadata?.is_admin === true;
    const claimRole = user.app_metadata?.role;
    
    const hasAccess = claimIsAdmin || claimRole === "supervisor" || claimRole === "admin";

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return { user, email: user.email || "admin" };
  } catch (error) {
    console.error("Auth Guard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
