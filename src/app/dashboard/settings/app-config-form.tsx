"use client";

import { useState, useCallback } from "react";
import { updateAppConfig } from "./actions";
import {
  Check, X, AlertCircle,
  Hash, ToggleLeft, Braces, Link, Pencil,
  ChevronDown, ChevronUp, Save
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldType = "boolean" | "number" | "object" | "string";

function detectType(v: unknown): FieldType {
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "number") return "number";
  if (v !== null && typeof v === "object") return "object";
  return "string";
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ value }: { value: unknown }) {
  const t = detectType(value);
  const cfg = {
    boolean:
      typeof value === "boolean" && value
        ? { lbl: "مفعّل",   cls: "bg-success/10 text-success dark:text-success border-success/20" }
        : { lbl: "معطّل",   cls: "bg-error/10 text-error dark:text-error border-error/20" },
    number:   { lbl: "رقم",         cls: "bg-info/10 text-info dark:text-info border-info/20" },
    object:   { lbl: `كائن · ${Object.keys(value as object).length}`, cls: "bg-primary/10 text-primary border-primary/20" },
    string:   { lbl: "نص",         cls: "bg-surface-elevated text-text-disabled border-divider" },
  }[t];
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.cls}`}>
      {cfg.lbl}
    </span>
  );
}

// ─── Field-type icon ──────────────────────────────────────────────────────────

const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
  boolean: <ToggleLeft size={16} />,
  number:  <Hash size={16} />,
  object:  <Braces size={16} />,
  string:  <Link size={16} />,
};

// ─── Inline accordion drawer ──────────────────────────────────────────────────

function ConfigDrawer({
  config,
  onClose,
  onSaved,
}: {
  config: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const rawValue =
    typeof config.value === "object" && config.value !== null
      ? config.value
      : config.value;

  const type     = detectType(rawValue);
  const isObject = type === "object";
  const isBool   = type === "boolean";
  const isNum    = type === "number";

  const [strValue, setStrValue] = useState(
    isObject ? JSON.stringify(rawValue, null, 2) : String(rawValue ?? "")
  );
  const [objValue, setObjValue] = useState<Record<string, unknown>>(
    isObject ? { ...(rawValue as Record<string, unknown>) } : {}
  );
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleObjChange = (k: string, v: string, ft: string) =>
    setObjValue((prev) => ({
      ...prev,
      [k]: ft === "number" ? Number(v) : ft === "boolean" ? v === "true" : v,
    }));

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("key", config.key);
    try {
      fd.append("value", isObject ? JSON.stringify(objValue) : strValue);
      const res = await updateAppConfig(fd);
      if (res.error) setError(res.error);
      else onSaved();
    } catch (e: any) {
      setError(e.message || "حدث خطأ غير متوقع أثناء الحفظ.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl text-sm font-mono text-text-primary bg-surface border border-divider focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all";

  return (
    <div className="bg-surface-elevated/50 border-t border-divider p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-error/10 border border-error/20 text-error dark:text-error text-sm font-bold">
            <AlertCircle size={16} className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Input Areas */}
        <div className="space-y-4">
          {/* Boolean Input */}
          {isBool && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-divider">
              <span className="text-sm font-bold text-text-primary">
                {strValue === "true" ? "الخاصية مفعلة حالياً" : "الخاصية معطلة حالياً"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={strValue === "true"}
                onClick={() => setStrValue((p) => (p === "true" ? "false" : "true"))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${
                  strValue === "true" ? "bg-success" : "bg-surface-elevated border border-divider"
                }`}
              >
                <span
                  className={`absolute top-[3px] w-[16px] h-[16px] bg-white rounded-full shadow-sm transition-all duration-300 ${
                    strValue === "true" ? "right-[3px] translate-x-0" : "right-full translate-x-[19px]"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Number Input */}
          {isNum && (
            <div className="space-y-5">
              <div className="flex items-center rounded-xl border border-divider overflow-hidden bg-surface shadow-sm">
                <button type="button" onClick={() => setStrValue((p) => String(Math.max(0, Number(p) - 1)))}
                  className="w-12 h-12 flex items-center justify-center text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors border-l border-divider text-lg font-bold">
                  −
                </button>
                <input type="number" value={strValue} onChange={(e) => setStrValue(e.target.value)}
                  className="flex-1 h-12 text-center bg-transparent font-mono text-lg font-bold text-text-primary border-none outline-none focus:ring-0" />
                <button type="button" onClick={() => setStrValue((p) => String(Number(p) + 1))}
                  className="w-12 h-12 flex items-center justify-center text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors border-r border-divider text-lg font-bold">
                  +
                </button>
              </div>
              <input type="range" min={0} max={Math.max(Number(strValue) * 2, 100)} value={strValue}
                step={1} onChange={(e) => setStrValue(e.target.value)}
                className="w-full h-2 rounded-lg appearance-none bg-surface-elevated border border-divider accent-primary cursor-pointer" />
            </div>
          )}

          {/* Object Input */}
          {isObject && (
            <div className="space-y-4">
              <div className="rounded-xl border border-divider overflow-hidden divide-y divide-divider shadow-sm bg-surface">
                {Object.entries(objValue).map(([k, v]) => {
                  const ft = typeof v;
                  return (
                    <div key={k} className="grid grid-cols-[120px_1fr] md:grid-cols-[150px_1fr] items-center">
                      <div className="px-4 py-3 bg-surface-elevated/50 font-mono text-xs font-bold text-text-secondary border-l border-divider truncate">
                        {k}
                      </div>
                      <div className="p-1">
                        {ft === "boolean" ? (
                          <select value={String(v)} onChange={(e) => handleObjChange(k, e.target.value, "boolean")}
                            className="w-full px-3 py-2 bg-transparent border-none outline-none text-sm font-mono font-bold text-text-primary focus:ring-0 cursor-pointer">
                            <option value="true">true — مفعّل</option>
                            <option value="false">false — معطّل</option>
                          </select>
                        ) : ft === "number" ? (
                          <input type="number" value={v as number} onChange={(e) => handleObjChange(k, e.target.value, "number")}
                            className="w-full px-3 py-2 bg-transparent border-none outline-none text-sm font-mono font-bold text-text-primary focus:ring-0" />
                        ) : (
                          <input type="text" value={v as string} onChange={(e) => handleObjChange(k, e.target.value, "string")}
                            dir="auto"
                            className="w-full px-3 py-2 bg-transparent border-none outline-none text-sm font-mono font-bold text-text-primary focus:ring-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* String Input */}
          {type === "string" && (
            <input type="text" value={strValue} onChange={(e) => setStrValue(e.target.value)}
              dir="auto" className={inputCls} placeholder="أدخل القيمة..." />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-divider">
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {loading ? (
              <span className="w-5 h-5 border-2 border-[rgba(var(--color-white-rgb),0.3)] border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                حفظ التعديلات
              </>
            )}
          </button>
          <button onClick={onClose} disabled={loading}
            className="py-3 px-6 rounded-xl border border-divider bg-surface hover:bg-surface-elevated text-text-secondary text-sm font-bold transition-colors disabled:opacity-50">
            إلغاء
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main row ─────────────────────────────────────────────────────────────────

export function AppConfigRow({ config }: { config: any }) {
  const [open, setOpen]             = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const rawValue =
    typeof config.value === "object" && config.value !== null
      ? config.value
      : config.value;

  const type    = detectType(rawValue);
  const preview = type === "object" ? JSON.stringify(rawValue) : String(rawValue ?? "—");
  const short   = preview.length > 30 ? preview.slice(0, 30) + "…" : preview;

  const handleSaved = useCallback(() => {
    setOpen(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  }, []);

  return (
    <div className={`transition-colors duration-300 ${open ? "bg-primary/[0.02]" : "bg-transparent"}`}>
      {/* Row */}
      <div
        onClick={() => setOpen((o) => !o)}
        className="group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 cursor-pointer hover:bg-surface-elevated/50 transition-colors"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon box */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            open
              ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
              : "bg-surface-elevated border border-divider text-text-secondary group-hover:border-primary/30 group-hover:text-primary group-hover:bg-primary/5"
          }`}>
            {FIELD_ICONS[type]}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-text-primary">
                {config.label || config.key}
              </span>
              <TypeBadge value={rawValue} />
              
              {savedFlash && (
                <span className="flex items-center gap-1 text-xs text-success dark:text-success font-bold bg-success/10 px-2 py-0.5 rounded-full animate-in fade-in zoom-in duration-300">
                  <Check size={12} /> تم الحفظ بنجاح
                </span>
              )}
            </div>
            {config.description && (
              <p className="text-xs text-text-secondary mt-1.5 max-w-2xl leading-relaxed truncate">
                {config.description}
              </p>
            )}
            <p className="text-[10px] font-mono font-bold text-text-tertiary mt-2 opacity-70">
              {config.key}
            </p>
          </div>
        </div>

        {/* Action / Preview Area */}
        <div className="flex items-center gap-4 sm:pl-4 sm:border-l border-divider/50 self-end sm:self-center mt-2 sm:mt-0">
          <span className="hidden md:block text-xs font-mono font-bold text-text-tertiary bg-surface-elevated px-2.5 py-1 rounded-md border border-divider truncate max-w-[150px]" dir="ltr">
            {short}
          </span>
          <button
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              open 
                ? "bg-primary/10 text-primary" 
                : "text-text-tertiary group-hover:bg-primary group-hover:text-white group-hover:shadow-md border border-transparent group-hover:border-primary"
            }`}
          >
            {open ? <ChevronUp size={18} /> : <Pencil size={15} className="group-hover:hidden" />}
            {!open && <ChevronDown size={18} className="hidden group-hover:block" />}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      <div className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          {open && (
            <ConfigDrawer
              config={config}
              onClose={() => setOpen(false)}
              onSaved={handleSaved}
            />
          )}
        </div>
      </div>
    </div>
  );
}