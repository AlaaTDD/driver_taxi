"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, Plus, ArrowUpDown } from "lucide-react";

// ✅ BUG-6 FIX: WalletActions now shows TWO action types for user wallets:
//   1. "تعديل" (Adjust) → calls /api/wallets/adjust  (bonus/penalty/adjustment)
//   2. "شحن"   (Top-Up) → calls /api/wallets/top-up   (top_up — users only)
// For driver wallets, only "تعديل" is shown (top-up doesn't apply to drivers).
//
// The previous implementation only had the adjust form for both wallet types,
// leaving the top-up API completely unreachable from the UI.

type ActionTab = "adjust" | "topup";

export function WalletActions({
  walletId,
  walletType,
  userName,
}: {
  walletId: string;
  walletType: "driver" | "user";
  userName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActionTab>("adjust");
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    setActiveTab("adjust");
  }, []);

  // [UI-01 FIXED] Close on Escape key and backdrop click.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-surface-glass border border-divider hover:bg-surface-elevated hover:text-primary transition-all"
        title="تعديل الرصيد"
      >
        <span className="flex items-center justify-center font-bold text-[14px]">±</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div
            ref={panelRef}
            className="bg-surface border border-divider rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-divider">
              <h3 className="font-bold text-lg text-text-primary">تعديل رصيد المحفظة</h3>
              <button
                onClick={handleClose}
                aria-label="إغلاق"
                className="p-1 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-elevated"
              >
                <X size={18} />
              </button>
            </div>

            {/* User name display */}
            <div className="px-4 pt-4">
              <div className="px-3 py-2 bg-surface-elevated border border-divider rounded-xl text-[13px] font-bold text-text-primary mb-4">
                {userName}
              </div>
            </div>

            {/* Tab switcher — only shown for user wallets */}
            {walletType === "user" && (
              <div className="flex gap-2 px-4 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("adjust")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-bold transition-all ${
                    activeTab === "adjust"
                      ? "bg-primary-surface text-primary border border-primary/30"
                      : "bg-surface-glass text-text-tertiary border border-divider hover:bg-surface-elevated"
                  }`}
                >
                  <ArrowUpDown size={13} />
                  تعديل / مكافأة / غرامة
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("topup")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-bold transition-all ${
                    activeTab === "topup"
                      ? "bg-success/15 text-success border border-success/30"
                      : "bg-surface-glass text-text-tertiary border border-divider hover:bg-surface-elevated"
                  }`}
                >
                  <Plus size={13} />
                  شحن رصيد
                </button>
              </div>
            )}

            {/* ─── Adjust Form (driver + user) ─── */}
            {(walletType === "driver" || activeTab === "adjust") && (
              <form
                action="/api/wallets/adjust"
                method="POST"
                onSubmit={() => setIsLoading(true)}
                className="px-4 pb-4 space-y-4"
              >
                <input type="hidden" name="wallet_id" value={walletId} />
                <input type="hidden" name="wallet_type" value={walletType} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-text-secondary mb-1">المبلغ</label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      required
                      placeholder="مثال: 50 أو -50"
                      className="w-full px-3 py-2 bg-surface border border-divider rounded-xl text-[13px] text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                    <p className="text-[10px] text-text-tertiary mt-1">استخدم السالب للخصم</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-text-secondary mb-1">نوع العملية</label>
                    <select
                      name="type"
                      required
                      className="w-full px-3 py-2 bg-surface border border-divider rounded-xl text-[13px] text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                    >
                      <option value="adjustment">تعديل (Adjustment)</option>
                      <option value="bonus">مكافأة (Bonus)</option>
                      <option value="penalty">غرامة (Penalty)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-text-secondary mb-1">السبب (الوصف)</label>
                  <input
                    type="text"
                    name="description"
                    required
                    placeholder="سبب التعديل..."
                    className="w-full px-3 py-2 bg-surface border border-divider rounded-xl text-[13px] text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-[13px] font-bold text-text-secondary hover:bg-surface-elevated transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {isLoading ? "جاري الحفظ..." : "تأكيد التعديل"}
                  </button>
                </div>
              </form>
            )}

            {/* ─── Top-Up Form (user wallets only) ─── */}
            {walletType === "user" && activeTab === "topup" && (
              <form
                action="/api/wallets/top-up"
                method="POST"
                onSubmit={() => setIsLoading(true)}
                className="px-4 pb-4 space-y-4"
              >
                <input type="hidden" name="wallet_id" value={walletId} />

                <div>
                  <label className="block text-[12px] font-bold text-text-secondary mb-1">المبلغ (موجب فقط)</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="مثال: 100"
                    className="w-full px-3 py-2 bg-surface border border-divider rounded-xl text-[13px] text-text-primary focus:border-success focus:ring-1 focus:ring-success outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-text-secondary mb-1">ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    name="description"
                    placeholder="سبب الشحن..."
                    className="w-full px-3 py-2 bg-surface border border-divider rounded-xl text-[13px] text-text-primary focus:border-success focus:ring-1 focus:ring-success outline-none transition-all"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-[13px] font-bold text-text-secondary hover:bg-surface-elevated transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-success hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {isLoading ? "جاري الشحن..." : "تأكيد الشحن"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
