"use client";

import { useState } from "react";
import { updateAppCurrency } from "@/lib/currency";
import { Banknote, CheckCircle, Loader2 } from "lucide-react";

interface CurrencySettingsProps {
  currentCurrency: string;
}

const CURRENCIES = [
  { code: "EGP", name: "جنيه مصري", symbol: "ج.م" },
  { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
  { code: "USD", name: "دولار أمريكي", symbol: "$" },
  { code: "EUR", name: "يورو", symbol: "€" },
  { code: "AED", name: "درهم إماراتي", symbol: "د.إ" },
];

export function CurrencySettings({ currentCurrency }: CurrencySettingsProps) {
  const [currency, setCurrency] = useState(currentCurrency);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (newCurrency: string) => {
    setCurrency(newCurrency);
    setLoading(true);
    setSuccess(false);

    try {
      const result = await updateAppCurrency(newCurrency);
      if (result.error) {
        alert("حدث خطأ أثناء تحديث العملة: " + result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e: any) {
      alert("حدث خطأ غير متوقع: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-divider rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
          <Banknote size={24} />
        </div>
        <div>
          <h2 className="text-[17px] font-black text-text-primary mb-1">العملة الافتراضية للتطبيق</h2>
          <p className="text-sm text-text-secondary max-w-xl">
            هذه العملة ستظهر في جميع أنحاء لوحة التحكم (التسعيرة، الإحصائيات، الرحلات، إلخ).
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 relative min-w-[200px]">
        <select
          value={currency}
          onChange={(e) => handleUpdate(e.target.value)}
          disabled={loading}
          className="input-field w-full px-4 py-2.5 rounded-xl text-[14px] font-bold bg-surface-elevated border border-divider focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
        
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
          {loading ? (
            <Loader2 size={18} className="animate-spin text-primary" />
          ) : success ? (
            <CheckCircle size={18} className="text-success" />
          ) : (
             <span className="text-xs">▼</span>
          )}
        </div>
      </div>
    </div>
  );
}
