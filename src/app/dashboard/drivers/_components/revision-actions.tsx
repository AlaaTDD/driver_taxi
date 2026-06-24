"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useConfirm } from "@/components/confirm-dialog";

interface RevisionActionsProps {
  driverId: string;
  driverName: string;
  revisionId: string;
  isVerified: boolean;
}

export function RevisionActions({ driverId, driverName, revisionId, isVerified }: RevisionActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState<string | null>(null);

  const doFormAction = async (endpoint: string, body: Record<string, string>, successKey: string) => {
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

  const confirmedFormAction = async (
    endpoint: string,
    body: Record<string, string>,
    successKey: string,
    confirmTitle: string,
    confirmMessage: string,
    isDestructive: boolean,
  ) => {
    const ok = await confirm({ title: confirmTitle, message: confirmMessage, isDestructive });
    if (ok) doFormAction(endpoint, body, successKey);
  };

  const doResolve = async () => {
    const ok = await confirm({
      title: t("drivers.confirmResolveTitle"),
      message: t("drivers.confirmResolveMessage"),
      isDestructive: false,
    });
    if (!ok) return;

    setLoading("resolve");
    try {
      const res = await fetch("/api/drivers/resolve-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision_id: revisionId, status: "resolved" }),
      });
      if (res.ok) {
        toast.success(t("drivers.toast.revisionResolved"));
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t("common.error"));
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Verify — only if not already verified */}
      {!isVerified && (
        <button
          onClick={() => confirmedFormAction(
            "/api/drivers/verify", { driver_id: driverId }, "drivers.toast.verified",
            t("drivers.confirmVerifyTitle"), t("drivers.confirmVerifyMessage"), false,
          )}
          disabled={busy}
          className="table-action disabled:opacity-50"
          style={{ background: "var(--success-surface)", color: "var(--success)", borderColor: "var(--success-border)" }}
        >
          {loading === "/api/drivers/verify"
            ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <CheckCircle size={12} />}
          {t("drivers.verify")}
        </button>
      )}

      {/* Revoke — only if verified */}
      {isVerified && (
        <button
          onClick={() => confirmedFormAction(
            "/api/drivers/revoke", { driver_id: driverId }, "drivers.toast.revoked",
            t("drivers.confirmRevokeTitle"), t("drivers.confirmRevokeMessage"), true,
          )}
          disabled={busy}
          className="table-action disabled:opacity-50"
          style={{ background: "var(--warning-surface)", color: "var(--warning)", borderColor: "var(--warning-border)" }}
        >
          {loading === "/api/drivers/revoke"
            ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : null}
          {t("drivers.revoke")}
        </button>
      )}

      {/* Resolve revision */}
      <button
        onClick={doResolve}
        disabled={busy}
        className="table-action disabled:opacity-50"
        style={{ background: "var(--neutral-surface)", color: "var(--text-tertiary)", borderColor: "var(--neutral-border)" }}
      >
        {loading === "resolve"
          ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : null}
        {t("drivers.resolveRevision")}
      </button>

      {/* Request new revision — navigates to revision form */}
      <Link
        href={"/dashboard/drivers/revision?driver_id=" + driverId + "&name=" + encodeURIComponent(driverName)}
        className="table-action"
        style={{ background: "var(--accent-surface)", color: "var(--primary)", borderColor: "var(--accent-border)" }}
      >
        <AlertCircle size={12} />
        {t("drivers.requestRevision")}
      </Link>
    </div>
  );
}
