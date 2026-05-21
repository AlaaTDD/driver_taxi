"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Modal } from "./modal";
import { useTranslations } from "next-intl";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmDialogProvider");
  return context;
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<(value: boolean) => void>();

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolver?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver?.(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <Modal isOpen={isOpen} onClose={handleCancel} title={options.title} size="sm">
          <div className="space-y-6">
            <p className="text-text-secondary text-[14px] leading-relaxed">{options.message}</p>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-text-secondary transition-all hover:text-text-primary"
                style={{ background: "var(--surface-glass)", border: "1px solid var(--divider)" }}
              >
                {options.cancelText || t("common.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all ${
                  options.isDestructive ? "bg-error hover:bg-error/90" : "bg-primary hover:bg-primary/90"
                }`}
              >
                {options.confirmText || t("common.confirm") || "تأكيد"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}
