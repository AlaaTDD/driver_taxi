import { createAdminClient, createAuthAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminRoleSchema, formDataToObject, safeHandler, parseRequest, uuidSchema, z } from "@/lib/api/validation";

const SetRoleSchema = z.object({
  user_id: uuidSchema,
  role: adminRoleSchema,
});

export const POST = safeHandler(async (request: Request) => {
  // ── Auth Guard ──────────────────────────────────────────────────────────────
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

    const formData = await request.formData();
    const parsed = parseRequest(SetRoleSchema, formDataToObject(formData));
    if (parsed.response) return parsed.response;
    const { user_id: userId, role } = parsed.data;

    // CODE-03 FIX: An admin must not be able to demote themselves.
    // If they downgrade their own role to "user" or "driver" they lose access
    // to the admin panel immediately (next requireAdmin() will reject them).
    if (guard.user.id === userId) {
      return NextResponse.json(
        { error: "لا يمكن تغيير صلاحياتك بنفسك" },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();

    // 1. Update role in public.users table
    const { error } = await supabase.rpc("set_user_role", {
      p_user_id: userId,
      p_role: role,
    });

    if (error) throw error;

    // [WEB-C-01 FIXED] 2. Update app_metadata in auth.users so the next JWT
    // issued at login reflects the new role immediately.
    // Without this, requireAdmin() (which reads app_metadata) rejects the
    // newly promoted admin until they log out and back in.
    const authAdmin = createAuthAdminClient();
    const { error: metaError } = await authAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          is_admin: role === "admin" || role === "supervisor",
          role: role,
        },
      }
    );

    if (metaError) {
      console.error("Set role: app_metadata update failed:", metaError);
      // Non-fatal — DB role was updated; warn but don't fail the request.
      // The user will get the correct JWT on next login.
    }

    revalidatePath("/dashboard/users");
    return NextResponse.json({ success: true });
});
