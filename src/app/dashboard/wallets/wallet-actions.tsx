"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function WalletActions({ walletId, walletType, userName }: { walletId: string; walletType: "driver" | "user"; userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-divider rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-divider">
              <h3 className="font-bold text-lg text-text-primary">تعديل رصيد المحفظة</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-elevated">
                <X size={18} />
              </button>
            </div>
            
            <form action="/api/wallets/adjust" method="POST" onSubmit={() => setIsLoading(true)} className="p-4 space-y-4">
              <input type="hidden" name="wallet_id" value={walletId} />
              <input type="hidden" name="wallet_type" value={walletType} />

              <div>
                <label className="block text-[12px] font-bold text-text-secondary mb-1">المستخدم</label>
                <div className="px-3 py-2 bg-surface-elevated border border-divider rounded-xl text-[13px] font-bold text-text-primary">
                  {userName}
                </div>
              </div>

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
                  onClick={() => setIsOpen(false)}
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
          </div>
        </div>
      )}
    </>
  );
}
