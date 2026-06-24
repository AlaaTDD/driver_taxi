import { createAdminClient } from "@/lib/supabase/server";
import { formatDateSafe } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { getTranslations } from "next-intl/server";
import { Car, CheckCircle, AlertCircle, Star, Phone, Mail, User, FileText, ArrowRight, MessageSquare, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const supabase = createAdminClient();

  // drivers_profile.id = users.id (shared PK), so !inner always resolves.
  const { data: driver } = await supabase
    .from("drivers_profile")
    .select(`
      id, national_id, national_id_image_url,
      license_number, license_image_url,
      criminal_record_url, vehicle_type, vehicle_brand,
      vehicle_model, vehicle_year, vehicle_color, vehicle_plate,
      vehicle_image_url, is_verified, is_available,
      users!inner(id, name, phone, email, rating, total_trips, is_active, is_blocked, created_at)
    `)
    .eq("id", id)
    .single();

  if (!driver) return notFound();

  const user = driver.users as any;

  // The detail page passes itself as redirect_back so all action forms
  // return here instead of dropping the admin onto the drivers list.
  const detailPath = "/dashboard/drivers/" + driver.id;

  const docs = [
    { label: t("drivers.docsLabels.nationalIdImage"), url: driver.national_id_image_url },
    { label: t("drivers.docsLabels.licenseImage"), url: driver.license_image_url },
    { label: t("drivers.docsLabels.criminalRecord"), url: driver.criminal_record_url },
    { label: t("drivers.docsLabels.vehicleImage"), url: driver.vehicle_image_url },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/drivers" className="inline-flex items-center gap-2 text-text-disabled hover:text-text-primary transition-colors text-sm font-medium w-fit">
          <ArrowRight size={16} />
          {t("drivers.backToList")}
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-text-primary mb-2 flex items-center gap-3">
              {user.name}
              <Badge variant={user.is_blocked ? "error" : driver.is_verified ? "success" : "warning"} dot>
                {user.is_blocked ? t("drivers.status.blocked") : driver.is_verified ? t("drivers.status.verified") : t("drivers.status.pending")}
              </Badge>
            </h1>
            <p className="text-text-secondary text-sm">{t("drivers.registered")}: {formatDateSafe(user.created_at)}</p>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <Link
              href={"/dashboard/messages?user_id=" + user.id}
              className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: "var(--info-surface)", color: "var(--info)", border: "1px solid var(--info-border)" }}
            >
              <MessageSquare size={14} />
              {t("drivers.messageDriver")}
            </Link>

            <Link
              href={"/dashboard/drivers/revision?driver_id=" + driver.id + "&name=" + encodeURIComponent(user.name)}
              className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
            >
              <AlertCircle size={14} />
              {t("drivers.requestRevision")}
            </Link>

            {/* Block / Unblock — same endpoint used in the list page.
                redirect_back keeps the admin on the detail page after the action. */}
            <form action="/api/drivers/block" method="POST">
              <input type="hidden" name="driver_id" value={user.id} />
              <input type="hidden" name="action" value={user.is_blocked ? "unblock" : "block"} />
              <input type="hidden" name="redirect_back" value={detailPath} />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  background: user.is_blocked ? "var(--success-surface)" : "var(--error-surface)",
                  color: user.is_blocked ? "var(--success)" : "var(--error)",
                  border: "1px solid " + (user.is_blocked ? "var(--success-border)" : "var(--error-border)")
                }}
              >
                {user.is_blocked ? <Unlock size={14} /> : <Lock size={14} />}
                {user.is_blocked ? t("drivers.unblockDriver") : t("drivers.blockDriver")}
              </button>
            </form>

            {!driver.is_verified && !user.is_blocked && (
              <form action="/api/drivers/verify" method="POST">
                <input type="hidden" name="driver_id" value={driver.id} />
                <input type="hidden" name="redirect_back" value={detailPath} />
                <button type="submit"
                  className="px-4 py-2 rounded-xl text-[12px] font-bold text-white flex items-center gap-2 transition-opacity hover:opacity-80"
                  style={{ background: "linear-gradient(135deg, var(--success), var(--success-light))", boxShadow: "0 3px 8px var(--success-surface)" }}>
                  <CheckCircle size={14} />
                  {t("drivers.verify")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <User size={18} className="text-info" />
            {t("drivers.personalInfo")}
          </h2>
          <div className="space-y-4">
            <InfoRow label={t("drivers.fields.name")} value={user.name} />
            <InfoRow label={t("drivers.fields.phone")} value={<span className="num flex items-center gap-1"><Phone size={12} className="text-text-tertiary" /> {user.phone}</span>} />
            <InfoRow label={t("drivers.fields.email")} value={user.email ? <span className="flex items-center gap-1"><Mail size={12} className="text-text-tertiary" /> {user.email}</span> : "—"} />
            <InfoRow label={t("drivers.fields.nationalId")} value={<span className="num">{driver.national_id || "—"}</span>} />
            <InfoRow label={t("drivers.fields.licenseNumber")} value={<span className="num">{driver.license_number || "—"}</span>} />
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <Car size={18} style={{ color: "var(--color-cyan)" }} />
            {t("drivers.vehicleInfo")}
          </h2>
          <div className="space-y-4">
            <InfoRow label={t("drivers.fields.vehicleType")} value={driver.vehicle_type === "car" ? t("drivers.fields.vehicleTypeCar") : t("drivers.fields.vehicleTypeMotorcycle")} />
            <InfoRow label={t("drivers.fields.brandModel")} value={(driver.vehicle_brand || "" + " - " + driver.vehicle_model || "").trim() || "—"} />
            <InfoRow label={t("drivers.fields.vehicleYear")} value={<span className="num">{driver.vehicle_year || "—"}</span>} />
            <InfoRow label={t("drivers.fields.vehicleColor")} value={driver.vehicle_color || "—"} />
            <InfoRow label={t("drivers.fields.vehiclePlate")} value={<span className="num" style={{ background: "var(--surface-glass)", padding: "2px 8px", borderRadius: "4px" }}>{driver.vehicle_plate || "—"}</span>} />
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <Star size={18} className="text-warning" />
            {t("drivers.performanceStats")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label={t("drivers.fields.rating")} value={<span className="num text-warning">{user.rating?.toFixed(1) || "0.0"}</span>} />
            <StatBox label={t("drivers.fields.totalTrips")} value={<span className="num text-info">{user.total_trips || 0}</span>} />
            <StatBox label={t("drivers.fields.availability")} value={<span style={{ color: driver.is_available ? "var(--success)" : "var(--text-disabled)" }}>{driver.is_available ? t("drivers.fields.availableNow") : t("drivers.fields.unavailable")}</span>} />
            <StatBox label={t("drivers.fields.appActivity")} value={<span style={{ color: user.is_active ? "var(--success)" : "var(--error)" }}>{user.is_active ? t("drivers.fields.activeUser") : t("drivers.fields.inactiveUser")}</span>} />
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--divider)" }}>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <FileText size={18} className="text-success" />
            {t("drivers.documents")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {docs.map((doc, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <span className="text-text-secondary text-sm font-bold">{doc.label}</span>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="relative group block rounded-xl overflow-hidden border border-divider" style={{ aspectRatio: "4 / 3", background: "rgba(var(--color-black-rgb),0.5)" }}>
                    <Image src={doc.url} alt={doc.label} fill sizes="(max-width: 768px) 100vw, 300px" className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(var(--color-black-rgb),0.3)] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-3 py-1.5 rounded-lg text-white font-bold text-[12px]" style={{ background: "rgba(var(--color-white-rgb),0.15)", backdropFilter: "blur(4px)" }}>
                        {t("drivers.docsLabels.viewImage")}
                      </span>
                    </div>
                  </a>
                ) : (
                  <div className="rounded-xl flex items-center justify-center text-text-disabled text-[12px]" style={{ aspectRatio: "4 / 3", background: "rgba(var(--color-black-rgb),0.2)", border: "1px dashed var(--divider)" }}>
                    {t("drivers.docsLabels.notUploaded")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px dashed var(--divider)" }}>
      <span className="text-text-disabled text-sm">{label}</span>
      <span className="text-text-primary font-bold">{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl text-center" style={{ background: "var(--surface-glass)" }}>
      <p className="text-text-disabled text-sm mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
