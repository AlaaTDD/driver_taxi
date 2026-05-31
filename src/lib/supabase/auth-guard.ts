import { createClient } from "./server";
import { NextResponse } from "next/server";

/**
 * Validates that the incoming API request is from an authenticated admin user.
 * Returns the authenticated user object if valid, or a 401/403 Response if not.
 *
 * [WEB-H-03 FIXED] Single DB round-trip: verifies JWT via supabase.auth.getUser(),
 * then trusts app_metadata for role/is_admin/is_blocked/is_active.
 * These fields are kept in sync by:
 *   • set-role route  → writes role + is_admin to app_metadata
 *   • block route     → writes is_blocked to app_metadata
 * The previous second SELECT on public.users (~2 ms/request) is eliminated.
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

    const meta = user.app_metadata ?? {};
    const claimIsAdmin  = meta.is_admin  === true;
    const claimRole     = meta.role      as string | undefined;
    const claimBlocked  = meta.is_blocked  === true;
    const claimInactive = meta.is_active   === false;

    const hasAccess =
      (claimIsAdmin || claimRole === "supervisor" || claimRole === "admin") &&
      !claimBlocked &&
      !claimInactive;

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return { user, email: user.email || "admin" };
  } catch (error) {
    console.error("Auth Guard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
