"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CheckCircle, Lock, Unlock, AlertCircle, Eye, ShieldBan,
} from "lucide-react";
import Link from "next/link";
import { useConfirm } from "@/components/confirm-dialog";
import { ActionsMenu } from "./actions-menu";

interface DriverActionsProps {
  driverId: string;
  driverName: string;
  isVerified: boolean;
  isBlocked: boolean;
}

// ─── Desktop table row — single "⋯" menu with ALL actions ────────────────────
export function DriverActions({ driverId, driverName, isVerified, isBlocked }: DriverActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState<string | null>(null);

  const doAction = async (endpoint: string, body: Record<string, string>, successKey: string) => {
    setLoading(endpoint);
    try {
      const formData = new FormData();
      for (const [k, v] of Object.entries(body)) formData.append(k, v);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (res.ok || (res.status >= 200 && res.status < 500)) {
        const finalUrl = new URL(res.url, window.location.origin);
        if (finalUrl.searchParams.get("error")) {
          toast.error(t("common.error"));
        } else {
          toast.success(t(successKey));
          router.refresh();
        }
      } else {
        toast.error(t("common.error"));
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(null);
    }
  };

  const confirmedAction = async (
    endpoint: string,
    body: Record<string, string>,
    successKey: string,
    confirmTitle: string,
    confirmMessage: string,
    isDestructive: boolean,
  ) => {
    const ok = await confirm({ title: confirmTitle, message: confirmMessage, isDestructive });
    if (ok) doAction(endpoint, body, successKey);
  };

  const busy = loading !== null;

  return (
    <ActionsMenu
      ariaLabel={t("common.actions")}
      items={[
        // ① Verify (pending only)
        ...(!isVerified && !isBlocked
          ? [{
              key: "verify",
              label: t("drivers.verify"),
              icon: <CheckCircle size={13} />,
              variant: "success" as const,
              disabled: busy,
              onClick: () => confirmedAction(
                "/api/drivers/verify", { driver_id: driverId }, "drivers.toast.verified",
                t("drivers.confirmVerifyTitle"), t("drivers.confirmVerifyMessage"), false,
              ),
            }]
          : []),
        // ② Revoke (approved only)
        ...(isVerified && !isBlocked
          ? [{
              key: "revoke",
              label: t("drivers.revoke"),
              icon: <ShieldBan size={13} />,
              variant: "danger" as const,
              disabled: busy,
              onClick: () => confirmedAction(
                "/api/drivers/revoke", { driver_id: driverId }, "drivers.toast.revoked",
                t("drivers.confirmRevokeTitle"), t("drivers.confirmRevokeMessage"), true,
              ),
            }]
          : []),
        // ③ Request revision — available for both pending AND approved (any non-blocked driver)
        ...(!isBlocked
          ? [{
              key: "revision",
              label: t("drivers.requestRevision"),
              icon: <AlertCircle size={13} />,
              disabled: busy,
              onClick: () => router.push(
                "/dashboard/drivers/revision?driver_id=" + driverId +
                "&name=" + encodeURIComponent(driverName),
              ),
            }]
          : []),
        // ④ Block / Unblock — always present
        {
          key: "block",
          label: isBlocked ? t("drivers.unblock") : t("drivers.block"),
          icon: isBlocked ? <Unlock size={13} /> : <Lock size={13} />,
          variant: isBlocked ? "success" as const : "danger" as const,
          disabled: busy,
          onClick: () => confirmedAction(
            "/api/drivers/block",
            { driver_id: driverId, action: isBlocked ? "unblock" : "block" },
            isBlocked ? "drivers.toast.unblocked" : "drivers.toast.blocked",
            isBlocked ? t("drivers.confirmUnblockTitle") : t("drivers.confirmBlockTitle"),
            isBlocked ? t("drivers.confirmUnblockMessage") : t("drivers.confirmBlockMessage"),
            !isBlocked,
          ),
        },
        // ⑤ Details — always last
        {
          key: "details",
          label: t("drivers.details"),
          icon: <Eye size={13} />,
          onClick: () => router.push("/dashboard/drivers/" + driverId),
        },
      ]}
    />
  );
}

// ─── Mobile card actions ──────────────────────────────────────────────────────

type DriverCardActionsProps = DriverActionsProps;

export function DriverCardActions({ driverId, driverName, isVerified, isBlocked }: DriverCardActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState<string | null>(null);

  const doAction = async (endpoint: string, body: Record<string, string>, successKey: string) => {
    setLoading(endpoint);
    try {
      const formData = new FormData();
      for (const [k, v] of Object.entries(body)) formData.append(k, v);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (res.ok || (res.status >= 200 && res.status < 500)) {
        const finalUrl = new URL(res.url, window.location.origin);
        if (finalUrl.searchParams.get("error")) {
          toast.error(t("common.error"));
        } else {
          toast.success(t(successKey));
          router.refresh();
        }
      } else {
        toast.error(t("common.error"));
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(null);
    }
  };

  const confirmedAction = async (
    endpoint: string,
    body: Record<string, string>,
    successKey: string,
    confirmTitle: string,
    confirmMessage: string,
    isDestructive: boolean,
  ) => {
    const ok = await confirm({ title: confirmTitle, message: confirmMessage, isDestructive });
    if (ok) doAction(endpoint, body, successKey);
  };

  const busy = loading !== null;

  return (
    <div className="flex gap-2 flex-wrap">
      {!isVerified && !isBlocked && (
        <button
          onClick={() => confirmedAction(
            "/api/drivers/verify", { driver_id: driverId }, "drivers.toast.verified",
            t("drivers.confirmVerifyTitle"), t("drivers.confirmVerifyMessage"), false,
          )}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--success), var(--success-light))", boxShadow: "0 3px 10px rgba(var(--success-rgb), 0.2)" }}
        >
          {loading === "/api/drivers/verify"
            ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <CheckCircle size={13} />}
          {t("drivers.verify")}
        </button>
      )}
      {isVerified && !isBlocked && (
        <button
          onClick={() => confirmedAction(
            "/api/drivers/revoke", { driver_id: driverId }, "drivers.toast.revoked",
            t("drivers.confirmRevokeTitle"), t("drivers.confirmRevokeMessage"), true,
          )}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ background: "var(--warning-surface)", color: "var(--warning)", border: "1px solid var(--warning-border)" }}
        >
          {t("drivers.revoke")}
        </button>
      )}
      {isVerified && !isBlocked && (
        <Link
          href={"/dashboard/drivers/revision?driver_id=" + driverId + "&name=" + encodeURIComponent(driverName)}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
          style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
        >
          <AlertCircle size={13} />
          {t("drivers.requestRevision")}
        </Link>
      )}
      <button
        onClick={() => confirmedAction(
          "/api/drivers/block",
          { driver_id: driverId, action: isBlocked ? "unblock" : "block" },
          isBlocked ? "drivers.toast.unblocked" : "drivers.toast.blocked",
          isBlocked ? t("drivers.confirmUnblockTitle") : t("drivers.confirmBlockTitle"),
          isBlocked ? t("drivers.confirmUnblockMessage") : t("drivers.confirmBlockMessage"),
          !isBlocked,
        )}
        disabled={busy}
        className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
        style={isBlocked
          ? { background: "var(--success-surface)", color: "var(--success)", border: "1px solid var(--success-border)" }
          : { background: "var(--error-surface)", color: "var(--error)", border: "1px solid var(--error-border)" }}
      >
        {loading === "/api/drivers/block"
          ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : isBlocked ? <Unlock size={13} /> : <Lock size={13} />}
        {isBlocked ? t("drivers.unblock") : t("drivers.block")}
      </button>
      <Link href={"/dashboard/drivers/" + driverId} className="flex-1">
        <span
          className="flex items-center justify-center w-full py-2.5 rounded-xl text-[12px] font-bold"
          style={{ background: "var(--accent-surface)", color: "var(--primary)", border: "1px solid var(--accent-border)" }}
        >
          {t("drivers.details")}
        </span>
      </Link>
    </div>
  );
}
