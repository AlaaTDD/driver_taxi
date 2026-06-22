"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-guard";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { safeErrorMessage } from "@/lib/api/validation";

// SEC-03 FIX: Validate all required fields before touching formData.
const couponBaseSchema = z.object({
  code:           z.string().trim().min(1, "الكود مطلوب").max(50),
  discount_type:  z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().finite().positive("قيمة الخصم يجب أن تكون أكبر من صفر"),
});

export async function createCoupon(formData: FormData) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return { error: "غير مصرح لك بإجراء هذا العمل" };

  const baseCheck = couponBaseSchema.safeParse({
    code:           formData.get("code"),
    discount_type:  formData.get("discount_type"),
    discount_value: formData.get("discount_value"),
  });
  if (!baseCheck.success) {
    return { error: baseCheck.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = createAdminClient();

  const data: Record<string, unknown> = {
    code: baseCheck.data.code.toUpperCase(),
    discount_type: baseCheck.data.discount_type,
    discount_value: baseCheck.data.discount_value,
    is_active: true,
  };

  // Optional fields
  const optionalString = (key: string, field: string) => {
    const val = formData.get(key) as string;
    if (val) data[field] = val;
  };
  const optionalNumber = (key: string, field: string) => {
    const val = formData.get(key) as string;
    if (val) data[field] = Number(val);
  };
  const optionalBool = (key: string, field: string) => {
    const val = formData.get(key) as string;
    data[field] = val === "true";
  };
  const optionalDate = (key: string, field: string) => {
    const val = formData.get(key) as string;
    if (val) data[field] = new Date(val).toISOString();
  };

  optionalString("title", "title");
  optionalNumber("min_trip_price", "min_trip_price");
  optionalNumber("max_uses", "max_uses");
  optionalNumber("max_uses_per_user", "max_uses_per_user");
  optionalNumber("max_discount", "max_discount");
  optionalNumber("budget_limit", "budget_limit");
  optionalDate("expires_at", "expires_at");
  optionalDate("starts_at", "starts_at");
  optionalBool("first_ride_only", "first_ride_only");
  optionalBool("new_users_only", "new_users_only");
  optionalBool("auto_apply", "auto_apply");
  optionalString("funded_by", "funded_by");
  optionalString("description_ar", "description_ar");
  optionalString("description_en", "description_en");

  const { error } = await supabase.from("coupons").insert(data);

  if (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/dashboard/coupons");
  return { success: true };
}

export async function updateCoupon(couponId: string, formData: FormData) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return { error: "غير مصرح لك بإجراء هذا العمل" };

  const baseCheck = couponBaseSchema.safeParse({
    code:           formData.get("code"),
    discount_type:  formData.get("discount_type"),
    discount_value: formData.get("discount_value"),
  });
  if (!baseCheck.success) {
    return { error: baseCheck.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const supabase = createAdminClient();

  const data: Record<string, unknown> = {
    code: baseCheck.data.code.toUpperCase(),
    discount_type: baseCheck.data.discount_type,
    discount_value: baseCheck.data.discount_value,
  };

  const optionalString = (key: string, field: string) => {
    const val = formData.get(key) as string;
    data[field] = val || null;
  };
  const optionalNumber = (key: string, field: string) => {
    const val = formData.get(key) as string;
    data[field] = val ? Number(val) : null;
  };
  const optionalBool = (key: string, field: string) => {
    data[field] = formData.get(key) === "true";
  };
  const optionalDate = (key: string, field: string) => {
    const val = formData.get(key) as string;
    data[field] = val ? new Date(val).toISOString() : null;
  };

  optionalString("title", "title");
  optionalNumber("min_trip_price", "min_trip_price");
  optionalNumber("max_uses", "max_uses");
  optionalNumber("max_uses_per_user", "max_uses_per_user");
  optionalNumber("max_discount", "max_discount");
  optionalNumber("budget_limit", "budget_limit");
  optionalDate("expires_at", "expires_at");
  optionalDate("starts_at", "starts_at");
  optionalBool("first_ride_only", "first_ride_only");
  optionalBool("new_users_only", "new_users_only");
  optionalBool("auto_apply", "auto_apply");
  optionalString("funded_by", "funded_by");
  optionalString("description_ar", "description_ar");
  optionalString("description_en", "description_en");

  const { error } = await supabase
    .from("coupons")
    .update(data)
    .eq("id", couponId);

  if (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/dashboard/coupons");
  return { success: true };
}
