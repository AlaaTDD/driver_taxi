"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Zap, Shield, ArrowLeft } from "lucide-react";

export default function LoginPage() {
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
        setError("الإيميل أو كلمة المرور غير صحيحة");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--background)" }}>

      {/* ===== ANIMATED BACKGROUND ===== */}
      {/* Large ambient blobs */}
      <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", animation: "float 12s ease-in-out infinite" }} />
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", animation: "float 10s ease-in-out 4s infinite" }} />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none -translate-y-1/2"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)", animation: "float 14s ease-in-out 2s infinite" }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Floating particles */}
      {[
        { top: "15%", right: "12%", size: 3, color: "#3B82F6", delay: "0s", dur: "8s" },
        { top: "28%", left: "8%", size: 4, color: "#8B5CF6", delay: "1.5s", dur: "10s" },
        { bottom: "35%", right: "18%", size: 2, color: "#06B6D4", delay: "0.8s", dur: "7s" },
        { bottom: "20%", left: "15%", size: 5, color: "#EC4899", delay: "2s", dur: "9s" },
        { top: "55%", right: "6%", size: 2, color: "#10B981", delay: "1s", dur: "11s" },
        { top: "40%", left: "25%", size: 3, color: "#F59E0B", delay: "3s", dur: "8s" },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: p.top,
            bottom: (p as Record<string, string>).bottom,
            right: p.right,
            left: (p as Record<string, string>).left,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `float ${p.dur} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      {/* ===== MAIN CARD ===== */}
      <div className="relative w-full max-w-[420px] mx-4 z-10">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-5">
            {/* Glow halo */}
            <div
              className="absolute inset-0 rounded-3xl scale-150 blur-2xl"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.3))", animation: "pulse-glow 3s ease-in-out infinite" }}
            />
            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center border border-white/10"
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
                boxShadow: "0 20px 50px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              <Zap size={36} className="text-white" style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.6))" }} />
            </div>
          </div>

          <h1
            className="text-4xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #F0F6FF 0%, #93C5FD 50%, #C4B5FD 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            تاكسي
          </h1>
          <p className="text-text-tertiary text-[13px] mt-2 font-medium tracking-wide">
            لوحة تحكم الأدمن
          </p>
        </div>

        {/* Glass Card */}
        <div className="relative">
          {/* Animated gradient border */}
          <div
            className="absolute -inset-[1px] rounded-2xl opacity-60"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.6) 0%, rgba(139,92,246,0.4) 50%, rgba(6,182,212,0.5) 100%)",
              backgroundSize: "300% 300%",
              animation: "gradient-shift 6s ease infinite",
              filter: "blur(0.5px)",
            }}
          />

          <div
            className="relative rounded-2xl p-8"
            style={{
              background: "rgba(7, 15, 30, 0.9)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <form onSubmit={handleLogin} className="space-y-5" id="login-form">

              {/* Email Field */}
              <div>
                <label className="block text-[12px] font-bold text-text-secondary mb-2 uppercase tracking-wider">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@taxi.com"
                    className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all duration-200"
                    style={{
                      background: "rgba(15,30,53,0.7)",
                      border: "1px solid rgba(26,45,71,0.8)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = "rgba(59,130,246,0.6)";
                      (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15), 0 0 20px rgba(59,130,246,0.08)";
                      (e.target as HTMLInputElement).style.background = "rgba(15,30,53,0.9)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = "rgba(26,45,71,0.8)";
                      (e.target as HTMLInputElement).style.boxShadow = "none";
                      (e.target as HTMLInputElement).style.background = "rgba(15,30,53,0.7)";
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-[12px] font-bold text-text-secondary mb-2 uppercase tracking-wider">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••"
                    className="w-full px-4 py-3.5 pl-12 rounded-xl text-[14px] outline-none transition-all duration-200"
                    style={{
                      background: "rgba(15,30,53,0.7)",
                      border: "1px solid rgba(26,45,71,0.8)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = "rgba(59,130,246,0.6)";
                      (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15), 0 0 20px rgba(59,130,246,0.08)";
                      (e.target as HTMLInputElement).style.background = "rgba(15,30,53,0.9)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = "rgba(26,45,71,0.8)";
                      (e.target as HTMLInputElement).style.boxShadow = "none";
                      (e.target as HTMLInputElement).style.background = "rgba(15,30,53,0.7)";
                    }}
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-text-disabled hover:text-primary transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#F87171",
                    boxShadow: "0 4px 16px rgba(239,68,68,0.1)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "#EF4444", boxShadow: "0 0 8px rgba(239,68,68,0.6)", animation: "pulse-glow 2s ease-in-out infinite" }}
                  />
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="relative w-full py-4 rounded-xl font-black text-[15px] text-white overflow-hidden transition-all duration-300 group"
                style={{
                  background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
                  backgroundSize: "200% 100%",
                  boxShadow: loading ? "none" : "0 8px 30px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(59,130,246,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 30px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                {/* Shimmer sweep */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite",
                  }}
                />

                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      تسجيل الدخول
                      <ArrowLeft size={17} className="group-hover:-translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5 mt-5">
              <Shield size={11} className="text-text-disabled" />
              <span className="text-[11px] text-text-disabled">بيانات مشفرة وآمنة</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-text-disabled/50 text-[11px] mt-7 tracking-wider">
          نظام إدارة تاكسي &copy; {new Date().getFullYear()} — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
