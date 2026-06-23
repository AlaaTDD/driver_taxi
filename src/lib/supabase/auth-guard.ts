import { createClient } from "./server";
import { NextResponse } from "next/server";

/**
 * Validates that the incoming API request is from an authenticated admin user.
 * Returns the authenticated user object if valid, or a 401/403 Response if not.
 *
 * [SEC-01 FIXED] The guard previously trusted only JWT app_metadata claims.
 * That allowed a blocked admin to keep accessing endpoints until their JWT
 * expired, because `is_blocked` is written to the DB by `block_user` RPC and
 * only mirrored into app_metadata as a *non-fatal* best-effort sync (which can
 * fail silently). We now also consult the database: a single cheap lookup on
 * `users` (is_blocked / is_active / role / is_admin) gated behind the existing
 * RLS index on `id`. If the DB says the user is blocked or inactive, we reject
 * immediately regardless of what the stale JWT claims.
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

    // Fast JWT-based pre-check. If the JWT itself says blocked/inactive/not-admin
    // we can reject without touching the database.
    const claimHasAccess =
      (claimIsAdmin || claimRole === "supervisor" || claimRole === "admin") &&
      !claimBlocked &&
      !claimInactive;

    if (!claimHasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // [SEC-01] Authoritative DB check. Guards against the case where the user
    // was blocked/demoted after the JWT was issued and the app_metadata sync
    // either did not run yet or failed (block/route.ts treats it as non-fatal).
    // Indexed by users.id (PK) → ~1ms.
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("is_blocked, is_active, role, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (dbError) {
      // If we genuinely cannot reach the DB, fail closed — better to block a
      // legitimate request than to let a blocked admin through.
      console.error("Auth Guard DB check error:", dbError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !dbUser ||
      dbUser.is_blocked === true ||
      dbUser.is_active === false ||
      !(
        dbUser.is_admin === true ||
        dbUser.role === "admin" ||
        dbUser.role === "supervisor"
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return { user, email: user.email || "admin" };
  } catch (error) {
    console.error("Auth Guard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
