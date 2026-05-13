"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

export function LocalTimeDisplay() {
  const locale = useLocale();
  const [dateStr, setDateStr] = useState("");
  const [hijriStr, setHijriStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const isAr = locale === "ar";
      const arLoc = "ar-EG";
      const enLoc = "en-US";
      
      // using umalqura calendar for Hijri
      const arHijri = "ar-SA-u-ca-islamic-umalqura";
      const enHijri = "en-US-u-ca-islamic-umalqura";
      
      setDateStr(
        new Intl.DateTimeFormat(isAr ? arLoc : enLoc, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }).format(now)
      );

      setHijriStr(
        new Intl.DateTimeFormat(isAr ? arHijri : enHijri, {
          year: "numeric",
          month: "long",
          day: "numeric"
        }).format(now)
      );

      setTimeStr(
        new Intl.DateTimeFormat(isAr ? arLoc : enLoc, {
          hour: "2-digit",
          minute: "2-digit"
        }).format(now)
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, [locale]);

  if (!dateStr) {
    return <div className="h-[32px] animate-pulse bg-surface-elevated rounded-xl w-64" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-divider bg-surface px-3 py-1.5 text-[11px] font-bold text-text-secondary shadow-sm">
        <CalendarDays size={13} className="text-primary" />
        <span>{dateStr}</span>
        <span className="text-text-tertiary font-normal">|</span>
        <span>{hijriStr}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-black text-primary shadow-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
        <Clock size={13} />
        <span dir="ltr">{timeStr}</span>
      </div>
    </div>
  );
}
