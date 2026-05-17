import re

with open("src/app/globals.css", "r") as f:
    content = f.read()

# 1. Remove @import
content = re.sub(r"@import url\('https://fonts.googleapis.com.*?\);\n", "", content)

# 2. Change Primary Light
primary_light = """  /* ── BRAND (Amber / Taxi Gold) ── */
  --primary: #F59E0B;
  --primary-rgb: 245, 158, 11;
  --primary-dark: #D97706;
  --primary-light: #FCD34D;
  --primary-text: #B45309;  /* WCAG AA on white — 4.64:1 contrast */
  --primary-surface: rgba(245, 158, 11, 0.10);"""
primary_light_new = """  /* ── BRAND (Indigo) ── */
  --primary: #6366F1;
  --primary-rgb: 99, 102, 241;
  --primary-dark: #4F46E5;
  --primary-light: #818CF8;
  --primary-text: #4338CA;
  --primary-surface: rgba(99, 102, 241, 0.10);"""
content = content.replace(primary_light, primary_light_new)

# 3. Change Warning Light Surface
warning_light = """  --warning-surface: rgba(249, 115, 22, 0.10);
  --warning-border: rgba(249, 115, 22, 0.25);"""
warning_light_new = """  --warning-surface: rgba(var(--warning-rgb), 0.10);
  --warning-border: rgba(var(--warning-rgb), 0.25);"""
content = content.replace(warning_light, warning_light_new)

# 4. Change Sidebar Light
sidebar_light = """  /* ── SIDEBAR ALIASES ── */
  --chrome-control-bg: #F1F5F9;
  --chrome-shadow: 0 16px 34px rgba(0, 0, 0, 0.06);
  --dashboard-content-bg: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  --sidebar-chrome-shadow: inset -1px 0 0 var(--divider), 4px 0 16px rgba(0, 0, 0, 0.03);

  /* ── SIDEBAR TOKENS — LIGHT ── */
  --sb-bg-gradient: linear-gradient(180deg, #F6F7FA 0%, #ECEEF4 100%);

  --sb-nav-text-active: #1E293B;


  --sb-divider: linear-gradient(to right, transparent, #D4D8E3, transparent);

  --sb-group-dot: #CBD5E1;

  --sb-footer-hover: #1E293B;
  --sb-logout-text: var(--error);

  --sb-logo-gradient: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  --sb-logo-shadow: 0 4px 12px rgba(245, 158, 11, 0.20);

  --sb-brand-gradient: linear-gradient(to right, #0F172A 0%, #334155 100%);

  --sb-tooltip-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);

  --sb-noise-opacity: 0;
  --sb-top-glow: none;
  --sb-top-glow-opacity: 0;
  --sb-mobile-btn-text: #D97706;
  --sb-backdrop: rgba(15, 23, 42, 0.40);"""
sidebar_light_new = """  /* ── SIDEBAR ALIASES ── */
  --chrome-control-bg: #F1F5F9;
  --chrome-shadow: 0 16px 34px rgba(0, 0, 0, 0.06);
  --dashboard-content-bg: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  --sidebar-chrome-shadow: inset -1px 0 0 var(--divider), 4px 0 16px rgba(0, 0, 0, 0.03);

  /* ── SIDEBAR TOKENS — LIGHT ── */
  --sb-bg-gradient: linear-gradient(180deg, var(--surface-elevated) 0%, var(--surface-high) 100%);

  --sb-nav-text-active: var(--text-primary);


  --sb-divider: linear-gradient(to right, transparent, #D4D8E3, transparent);

  --sb-group-dot: #CBD5E1;

  --sb-footer-hover: var(--text-primary);
  --sb-logout-text: var(--error);

  --sb-logo-gradient: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  --sb-logo-shadow: 0 4px 12px rgba(99, 102, 241, 0.20);

  --sb-brand-gradient: linear-gradient(to right, var(--text-primary) 0%, var(--text-secondary) 100%);

  --sb-tooltip-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);

  --sb-noise-opacity: 0;
  --sb-top-glow: none;
  --sb-top-glow-opacity: 0;
  --sb-mobile-btn-text: #4338CA;
  --sb-backdrop: rgba(15, 23, 42, 0.40);"""
content = content.replace(sidebar_light, sidebar_light_new)

# 5. Change Dark Backgrounds
dark_bg = """  /* ── BACKGROUNDS (Obsidian Slate) ── */
  --background: #070B14;
  --surface-high: #1E2840;
  --surface: #0F1520;
  --surface-elevated: #182030;
  --surface-muted: #0B1018;
  --surface-glass: rgba(18, 21, 28, 0.88);

  /* ── DIVIDERS (Extremely Clear Separation) ── */
  --divider: #282E3A;
  --divider-strong: #3B4354;
  --table-row-border: rgba(255, 255, 255, 0.08);"""
dark_bg_new = """  /* ── BACKGROUNDS (Zinc) ── */
  --background: #09090B;
  --surface-high: #27272A;
  --surface: #111113;
  --surface-elevated: #18181B;
  --surface-muted: #111113;
  --surface-glass: rgba(17, 17, 19, 0.88);

  /* ── DIVIDERS (Extremely Clear Separation) ── */
  --divider: #27272A;
  --divider-strong: #3F3F46;
  --table-row-border: rgba(255, 255, 255, 0.08);"""
content = content.replace(dark_bg, dark_bg_new)

# 6. Change Dark Brand
dark_brand = """  /* ── BRAND (Vibrant Amber on Dark) ── */
  --primary: #F59E0B;
  --primary-rgb: 245, 158, 11;
  --primary-dark: #D97706;
  --primary-light: #FCD34D;
  --primary-text: #F59E0B;  /* Amber has excellent contrast on dark */
  --primary-surface: rgba(245, 158, 11, 0.15);"""
dark_brand_new = """  /* ── BRAND (Indigo on Dark) ── */
  --primary: #6366F1;
  --primary-rgb: 99, 102, 241;
  --primary-dark: #4F46E5;
  --primary-light: #818CF8;
  --primary-text: #818CF8;
  --primary-surface: rgba(99, 102, 241, 0.15);"""
content = content.replace(dark_brand, dark_brand_new)

# 7. Change Warning Dark
warning_dark = """  --warning-surface: rgba(249, 115, 22, 0.15);
  --warning-border: rgba(249, 115, 22, 0.35);"""
warning_dark_new = """  --warning-surface: rgba(var(--warning-rgb), 0.15);
  --warning-border: rgba(var(--warning-rgb), 0.35);"""
content = content.replace(warning_dark, warning_dark_new)

# 8. Accents Dark
accents_dark = """  /* ── ACCENTS & NEUTRALS ── */
  --accent-surface: rgba(245, 158, 11, 0.12);
  --accent-surface-strong: rgba(245, 158, 11, 0.22);
  --accent-border: rgba(245, 158, 11, 0.35);
  --accent-shadow: rgba(245, 158, 11, 0.25);
  --neutral-surface: rgba(148, 163, 184, 0.10);
  --neutral-border: rgba(148, 163, 184, 0.22);
  --table-row-hover: rgba(255, 255, 255, 0.03);"""
accents_dark_new = """  /* ── ACCENTS & NEUTRALS ── */
  --accent-surface: rgba(99, 102, 241, 0.12);
  --accent-surface-strong: rgba(99, 102, 241, 0.22);
  --accent-border: rgba(99, 102, 241, 0.35);
  --accent-shadow: rgba(99, 102, 241, 0.25);
  --neutral-surface: rgba(148, 163, 184, 0.10);
  --neutral-border: rgba(148, 163, 184, 0.22);
  --table-row-hover: rgba(255, 255, 255, 0.06);"""
content = content.replace(accents_dark, accents_dark_new)

# 9. Dashboard BG Dark
dash_bg_dark = """  --dashboard-content-bg: radial-gradient(
    ellipse 60% 40% at 20% 0%,
    rgba(var(--primary-rgb), 0.04) 0%,
    transparent 50%
  ), #070B14;"""
dash_bg_dark_new = """  --dashboard-content-bg: radial-gradient(
    ellipse 60% 40% at 20% 0%,
    rgba(var(--primary-rgb), 0.04) 0%,
    transparent 50%
  ), var(--background);"""
content = content.replace(dash_bg_dark, dash_bg_dark_new)

# 10. Sidebar Tokens Dark
sidebar_dark = """  /* ── SIDEBAR TOKENS — DARK ── */
  --sb-bg-gradient: linear-gradient(180deg, #0D1420 0%, #080B14 100%);

  --sb-nav-text-active: #F8FAFC;


  --sb-divider: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.06), transparent);

  --sb-group-dot: rgba(255, 255, 255, 0.15);

  --sb-footer-hover: #F8FAFC;
  --sb-logout-text: var(--error);

  --sb-logo-gradient: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  --sb-logo-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);

  --sb-brand-gradient: linear-gradient(to right, #F8FAFC 0%, #CBD5E1 100%);

  --sb-tooltip-shadow: 0 12px 28px rgba(0, 0, 0, 0.60);

  --sb-noise-opacity: 0.03;
  --sb-top-glow: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(245,158,11,0.08), transparent);
  --sb-top-glow-opacity: 1;
  --sb-mobile-btn-text: #F59E0B;
  --sb-backdrop: rgba(8, 10, 15, 0.80);"""
sidebar_dark_new = """  /* ── SIDEBAR TOKENS — DARK ── */
  --sb-bg-gradient: linear-gradient(180deg, var(--surface) 0%, var(--background) 100%);

  --sb-nav-text-active: var(--text-primary);


  --sb-divider: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.06), transparent);

  --sb-group-dot: rgba(255, 255, 255, 0.15);

  --sb-footer-hover: var(--text-primary);
  --sb-logout-text: var(--error);

  --sb-logo-gradient: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  --sb-logo-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);

  --sb-brand-gradient: linear-gradient(to right, var(--text-primary) 0%, var(--text-secondary) 100%);

  --sb-tooltip-shadow: 0 12px 28px rgba(0, 0, 0, 0.60);

  --sb-noise-opacity: 0.03;
  --sb-top-glow: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(var(--primary-rgb),0.08), transparent);
  --sb-top-glow-opacity: 1;
  --sb-mobile-btn-text: #818CF8;
  --sb-backdrop: rgba(8, 10, 15, 0.80);"""
content = content.replace(sidebar_dark, sidebar_dark_new)

# 11. Theme inline
theme_inline = """@theme inline {
  --color-background: var(--background);"""
theme_inline_new = """@theme inline {
  --color-success-dark: #059669;
  --color-error-dark: #DC2626;
  --color-info-dark: #2563EB;
  --color-warning-dark: #D97706;
  --color-surface-glass: var(--surface-glass);
  --color-primary-rgb: var(--primary-rgb);
  --text-2xs: 10px;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-md: 15px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --font-mono: var(--font-mono);
  --font-sans-ar: var(--font-sans-ar);
  --font-sans-en: var(--font-sans-en);
  --color-background: var(--background);"""
content = content.replace(theme_inline, theme_inline_new)

# 12. Transitions
transitions = """*,
*::before,
*::after {
  box-sizing: border-box;
  transition: background-color 300ms ease, 
              border-color 300ms ease,
              color 200ms ease;
}"""
transitions_new = """*,
*::before,
*::after {
  box-sizing: border-box;
}

.themed {
  transition: background-color 300ms ease, 
              border-color 300ms ease,
              color 200ms ease;
}"""
content = content.replace(transitions, transitions_new)

# 13. Animate pulse glow
# I'll just append it to @layer utilities since it is already inside @layer utilities? Wait, I'll replace '.animate-fade-in {' with '.animate-pulse-glow {\n    animation: pulse-glow 2.4s ease-in-out infinite;\n  }\n\n  .animate-fade-in {'
content = content.replace(".animate-fade-in {", ".animate-pulse-glow {\n    animation: pulse-glow 2.4s ease-in-out infinite;\n  }\n\n  .animate-fade-in {")

with open("src/app/globals.css", "w") as f:
    f.write(content)

print("Done")
