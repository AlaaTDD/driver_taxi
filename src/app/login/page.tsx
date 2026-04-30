"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Zap, Shield, ArrowLeft, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(t("login.error"));
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("errors.generic"));
      setLoading(false);
    }
  };

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-background">
      {/* Ambient blobs - theme aware via opacity */}
      <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full pointer-events-none opacity-60 dark:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", animation: "float 12s ease-in-out infinite" }} />
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none opacity-60 dark:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", animation: "float 10s ease-in-out 4s infinite" }} />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none -translate-y-1/2 opacity-60 dark:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)", animation: "float 14s ease-in-out 2s infinite" }} />

      {/* Top bar */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-20">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-[420px] mx-4 z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 rounded-2xl scale-125 blur-xl bg-primary/20 dark:bg-primary/40 animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center bg-linear-to-br from-primary to-accent-purple shadow-lg shadow-primary/20">
              <Zap size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">
            {t("metadata.title")}
          </h1>
          <p className="text-text-tertiary text-sm mt-1 font-medium">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-divider rounded-2xl p-6 sm:p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-5" id="login-form">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">
                {t("login.emailPlaceholder")}
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@taxi.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 bg-surface-elevated border border-divider text-text-primary placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">
                {t("login.passwordPlaceholder")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 bg-surface-elevated border border-divider text-text-primary placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-primary/10 ${isRTL ? "pl-12" : "pr-12"}`}
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 p-1 text-text-disabled hover:text-primary transition-colors ${isRTL ? "left-3.5" : "right-3.5"}`}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-error/5 border border-error/20 text-error">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl font-bold text-sm text-white overflow-hidden transition-all duration-200 bg-primary hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("common.loading")}...
                  </>
                ) : (
                  <>
                    {t("login.submit")}
                    <Arrow size={16} className={isRTL ? "" : ""} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Shield size={11} className="text-text-tertiary" />
            <span className="text-[11px] text-text-tertiary">{isRTL ? "بيانات مشفرة وآمنة" : "Encrypted & Secure"}</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-text-disabled text-[11px] mt-6 tracking-wider">
          {isRTL ? `نظام إدارة تاكسي © ${new Date().getFullYear()}` : `Taxi Admin System © ${new Date().getFullYear()}`}
        </p>
      </div>
    </div>
  );
}
