"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Zap, Shield, ArrowLeft, ArrowRight, Mail, Lock } from "lucide-react";
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
    } catch {
      setError(t("errors.generic"));
      setLoading(false);
    }
  };

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-background">
      <div className="login-backdrop absolute inset-0 pointer-events-none" />

      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-primary/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] md:w-[450px] h-[300px] md:h-[450px] bg-[var(--color-purple)]/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0" />

      {/* Top Bar - Options */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-20">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-[420px] mx-4 z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 rounded-2xl scale-125 blur-xl animate-pulse-glow" style={{ background: "rgba(var(--primary-rgb), 0.3)" }} />
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center bg-linear-to-br from-[var(--primary)] to-[var(--color-purple)] shadow-lg shadow-[rgba(var(--primary-rgb),0.2)]">
              <Zap size={28} className="text-[var(--color-white)]" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">
            {t("metadata.title")}
          </h1>
          <p className="text-text-tertiary text-sm mt-1 font-medium">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-glass backdrop-blur-md border border-divider/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-linear-to-r from-[var(--primary)] to-[var(--color-purple)]" />
          
          <form onSubmit={handleLogin} className="space-y-5" id="login-form">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">
                {t("login.emailPlaceholder")}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className={`absolute top-1/2 -translate-y-1/2 text-text-disabled transition-colors ${
                    isRTL ? "right-4" : "left-4"
                  }`}
                />
                <input
                  type="email"
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("login.emailPlaceholder")}
                  className={`w-full py-3.5 rounded-xl text-sm outline-none transition-all duration-200 bg-surface-elevated/60 border border-divider text-text-primary placeholder:text-text-disabled focus:bg-surface-elevated focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                    isRTL ? "pr-11 pl-4" : "pl-11 pr-4"
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">
                {t("login.passwordPlaceholder")}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className={`absolute top-1/2 -translate-y-1/2 text-text-disabled transition-colors ${
                    isRTL ? "right-4" : "left-4"
                  }`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  className={`w-full py-3.5 rounded-xl text-sm outline-none transition-all duration-200 bg-surface-elevated/60 border border-divider text-text-primary placeholder:text-text-disabled focus:bg-surface-elevated focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                    isRTL ? "pr-11 pl-12" : "pl-11 pr-12"
                  }`}
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 p-1 text-text-disabled hover:text-primary transition-colors ${
                    isRTL ? "left-3.5" : "right-3.5"
                  }`}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-error/5 border border-error/20 text-error">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                {error}
              </div>
            )}

            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl font-bold text-sm text-white overflow-hidden transition-all duration-300 bg-linear-to-r from-[var(--primary)] to-[var(--color-purple)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
                    <Arrow size={16} />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Shield size={11} className="text-text-tertiary" />
            <span className="text-[11px] text-text-tertiary">{t("login.secureNote")}</span>
          </div>
        </div>

        <p className="text-center text-text-disabled text-[11px] mt-6 tracking-wider">
          {t("login.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
