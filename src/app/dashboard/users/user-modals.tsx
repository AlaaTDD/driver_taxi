"use client";

import { Modal } from "@/components/modal";
import { ShieldBan, UserCheck, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_admin: boolean;
  is_blocked: boolean;
  blocked_reason?: string;
  total_trips?: number;
}

export function UserBlockModal({
  blockModal,
  setBlockModal,
  handleBlock,
  blockReason,
  setBlockReason,
  actionLoading
}: {
  blockModal: { user: User; action: "block" | "unblock" } | null;
  setBlockModal: (val: any) => void;
  handleBlock: () => void;
  blockReason: string;
  setBlockReason: (val: string) => void;
  actionLoading: boolean;
}) {
  const t = useTranslations();
  if (!blockModal) return null;

  const ts = (key: string, fallback: string) => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };

  return (
    <Modal
      isOpen={!!blockModal}
      onClose={() => setBlockModal(null)}
      title={blockModal.action === "block" ? ts("users.blockUser", "حظر مستخدم") : ts("users.unblockUser", "إلغاء الحظر")}
      size="md"
    >
      <div className="flex flex-col items-center justify-center pt-2 pb-6 px-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${blockModal.action === "block" ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
          {blockModal.action === "block" ? <ShieldBan size={28} /> : <UserCheck size={28} />}
        </div>
        <h3 className="font-black text-[18px] text-text-primary mb-1 text-center">
          {blockModal.action === "block" ? ts("users.confirmBlock", "تأكيد الحظر") : ts("users.confirmUnblock", "رفع الحظر")}
        </h3>
        <p className="text-[14px] text-text-tertiary mb-6 text-center">{blockModal.user.name}</p>

        {blockModal.action === "block" && (
          <div className="w-full mb-6">
            <label className="block text-[11px] font-black uppercase tracking-widest text-text-tertiary mb-2">
              {ts("users.blockReason", "سبب الحظر")} ({ts("common.optional", "اختياري")})
            </label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full p-3.5 rounded-xl text-[13px] bg-surface-glass border border-divider text-text-primary placeholder:text-text-disabled focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none min-h-[80px]"
              placeholder={ts("users.blockReasonPlaceholder", "اكتب سبب حظر هذا المستخدم...")}
            />
          </div>
        )}

        {blockModal.action === "unblock" && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-6 bg-primary/10 border border-primary/20 text-primary">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <p className="text-[13px]">{ts("users.unblockWarning", "هل أنت متأكد من فك حظر هذا المستخدم؟ سيستعيد الوصول إلى حسابه فوراً.")}</p>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={() => setBlockModal(null)}
            className="flex-1 py-3.5 rounded-xl text-[14px] font-bold bg-surface-glass border border-divider text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
          >
            {ts("common.cancel", "إلغاء")}
          </button>
          <button
            onClick={handleBlock}
            disabled={actionLoading}
            className={`flex-1 py-3.5 rounded-xl text-[14px] font-black text-white transition-all disabled:opacity-50 ${blockModal.action === "block" ? "bg-error hover:bg-error-light shadow-[0_4px_12px_rgba(var(--error-rgb),0.3)]" : "bg-primary hover:bg-primary-light shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]"}`}
          >
            {actionLoading ? ts("common.loading", "جاري التحميل...") : ts("common.confirm", "تأكيد")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function UserRoleModal({
  roleModal,
  setRoleModal,
  handleSetRole,
  actionLoading
}: {
  roleModal: { user: User; role: string } | null;
  setRoleModal: (val: any) => void;
  handleSetRole: () => void;
  actionLoading: boolean;
}) {
  const t = useTranslations();
  if (!roleModal) return null;

  const ts = (key: string, fallback: string) => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };

  return (
    <Modal
      isOpen={!!roleModal}
      onClose={() => setRoleModal(null)}
      title={ts("users.changeRole", "تعديل دور المستخدم")}
      size="md"
    >
      <div className="flex flex-col items-center justify-center pt-2 pb-6 px-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 text-primary">
          <Shield size={28} />
        </div>
        <h3 className="font-black text-[18px] text-text-primary mb-1 text-center">
          {roleModal.role === "supervisor" ? ts("users.makeSupervisor", "تعيين كمشرف") : ts("users.removeSupervisor", "إلغاء صلاحيات الإشراف")}
        </h3>
        <p className="text-[14px] text-text-tertiary mb-6 text-center">{roleModal.user.name}</p>

        <div className="flex items-start gap-3 p-4 rounded-xl mb-6 bg-warning/10 border border-warning/20 text-warning">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="text-[13px]">
            {roleModal.role === "supervisor"
              ? ts("users.roleSupervisorWarning", "سيتمكن المشرف من عرض الشكاوي والرد عليها وطلب مراجعة السائقين.")
              : ts("users.roleUserWarning", "سيفقد المستخدم صلاحيات الإشراف فوراً.")}
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => setRoleModal(null)}
            className="flex-1 py-3.5 rounded-xl text-[14px] font-bold bg-surface-glass border border-divider text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
          >
            {ts("common.cancel", "إلغاء")}
          </button>
          <button
            onClick={handleSetRole}
            disabled={actionLoading}
            className="flex-1 py-3.5 rounded-xl text-[14px] font-black text-white bg-primary hover:bg-primary-light shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)] disabled:opacity-50 transition-all"
          >
            {actionLoading ? ts("common.loading", "جاري التحميل...") : ts("common.confirm", "تأكيد")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
