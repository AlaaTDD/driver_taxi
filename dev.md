# 🚖 خطة التطوير الشاملة — لوحة تحكم تاكسي
> تحليل عميق لكل ملف، كل مكوّن، كل صفحة — مع خطة تطوير تفصيلية كاملة

---

## 📋 فهرس المحتويات

1. [تحليل نظام الألوان الحالي وما يجب تغييره](#1-نظام-الألوان)
2. [تحليل نظام الخطوط والطباعة](#2-الطباعة-والخطوط)
3. [تحليل المكوّنات المشتركة](#3-المكونات-المشتركة)
4. [تحليل الصفحات الكاملة](#4-تحليل-الصفحات)
5. [المشاكل الحرجة التي يجب إصلاحها فوراً](#5-المشاكل-الحرجة)
6. [الأوامر الجاهزة للتطبيق](#6-أوامر-التطبيق)

---

## 1. نظام الألوان

### الوضع الراهن في `globals.css`

الكود الحالي عنده نظام ألوان مكتوب في `:root` للـ light mode وفي `.dark` للـ dark mode، وده شيء ممتاز كأساس. بس في مشاكل جوهرية:

#### ✅ ما هو صح

```css
/* الألوان الدلالية موجودة ومنظمة */
--success: #059669;
--warning: #d97706;
--error: #dc2626;
--info: #0891b2;
```

#### ❌ المشاكل الموجودة

**مشكلة 1 — التناقض بين Light Mode وDark Mode في السايدبار:**
الـ `sidebar.tsx` مكتوب عليه `background: linear-gradient(180deg, rgba(10,22,40,0.95)...` — ده لون داكن هاردكود، مش بياخد من متغيرات الـ CSS. يعني في الـ Light Mode السايدبار بيظهر داكن بالرغم من إن الصفحة فاتحة. ده بيخلق تضارب بصري.

**مشكلة 2 — `DashboardShell` مختلف عن `Sidebar`:**
في الكود عندك **ملفين** لعمل سايدبار:
- `sidebar.tsx` — داكن، gradient، أيقونات ملونة، glow effects
- `dashboard-shell.tsx` — فاتح، بسيط، بدون glow

وكل صفحة بتستخدم `DashboardShell` مش `Sidebar`. إذاً `sidebar.tsx` مش بيُستخدم فعلياً في أي صفحة! ده تضارب كبير ومشكلة في الكود.

**مشكلة 3 —ألوان هاردكود في الكومبوننتس:**
```tsx
// في stat-card.tsx
background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)"
border: `1px solid rgba(255,255,255,0.05)` // ← ده بيفضح Light Mode
boxShadow: "0 2px 12px rgba(0,0,0,0.3)"   // ← تقيل على Light Mode
```
كل الـ `rgba(255,255,255,...)` و `rgba(0,0,0,...)` الهاردكود دي بتبوظ الـ Light Mode.

**مشكلة 4 — `TopBar` يفترض دايماً Dark Mode:**
```tsx
background: "rgba(4, 8, 16, 0.85)"  // ← هاردكود داكن
borderBottom: "1px solid rgba(26, 45, 71, 0.8)" // ← هاردكود
```
الـ TopBar مش بيأخد من متغيرات الـ CSS خالص.

**مشكلة 5 — غياب ألوان Brand ثانوية:**
مفيش لون `--secondary` أو `--tertiary` للـ brand. كل حاجة على `--primary: blue`. التطبيق محتاج هوية بصرية أقوى.

---

### 🎨 التوصيات الشاملة لنظام الألوان الجديد

#### نظام الألوان المقترح الكامل لـ `globals.css`

```css
@import "tailwindcss";

/* ═══════════════════════════════════════════════
   TAXI ADMIN — DESIGN TOKENS v3.0
   ═══════════════════════════════════════════════ */

:root {
  /* ── BRAND IDENTITY ────────────────────────── */
  --brand-primary:   #F59E0B;   /* أصفر تاكسي — اللون الأساسي */
  --brand-secondary: #1D4ED8;   /* أزرق داكن — ثانوي */
  --brand-accent:    #7C3AED;   /* بنفسجي — مميز */

  /* ── BACKGROUNDS ───────────────────────────── */
  --bg-base:      #F8FAFC;
  --bg-subtle:    #F1F5F9;
  --bg-muted:     #E2E8F0;

  /* ── SURFACES ──────────────────────────────── */
  --surface-1:    #FFFFFF;       /* كارد عادي */
  --surface-2:    #F8FAFC;       /* كارد مرفوع */
  --surface-3:    #F1F5F9;       /* كارد عميق */
  --surface-overlay: rgba(255, 255, 255, 0.92);  /* modal overlay */

  /* ── BORDERS ───────────────────────────────── */
  --border-subtle:  #E2E8F0;
  --border-default: #CBD5E1;
  --border-strong:  #94A3B8;
  --border-focus:   #F59E0B;    /* border عند focus */

  /* ── TEXT ──────────────────────────────────── */
  --text-heading:   #0F172A;
  --text-body:      #1E293B;
  --text-muted:     #64748B;
  --text-placeholder: #94A3B8;
  --text-disabled:  #CBD5E1;
  --text-inverse:   #FFFFFF;
  --text-on-brand:  #FFFFFF;

  /* ── PRIMARY (Brand Yellow) ────────────────── */
  --primary:        #F59E0B;
  --primary-hover:  #D97706;
  --primary-active: #B45309;
  --primary-subtle: #FFFBEB;
  --primary-muted:  #FEF3C7;
  --primary-text:   #92400E;

  /* ── BLUE (Action Color) ───────────────────── */
  --blue:          #2563EB;
  --blue-hover:    #1D4ED8;
  --blue-subtle:   #EFF6FF;
  --blue-text:     #1E40AF;

  /* ── STATUS COLORS ─────────────────────────── */
  --success:        #059669;
  --success-hover:  #047857;
  --success-subtle: #ECFDF5;
  --success-muted:  #D1FAE5;
  --success-text:   #065F46;

  --warning:        #D97706;
  --warning-hover:  #B45309;
  --warning-subtle: #FFFBEB;
  --warning-muted:  #FEF3C7;
  --warning-text:   #92400E;

  --error:          #DC2626;
  --error-hover:    #B91C1C;
  --error-subtle:   #FEF2F2;
  --error-muted:    #FEE2E2;
  --error-text:     #991B1B;

  --info:           #0891B2;
  --info-subtle:    #ECFEFF;
  --info-muted:     #CFFAFE;
  --info-text:      #155E75;

  /* ── ACCENT COLORS ─────────────────────────── */
  --accent-violet:  #7C3AED;
  --accent-pink:    #DB2777;
  --accent-cyan:    #0891B2;
  --accent-emerald: #059669;
  --accent-amber:   #D97706;
  --accent-rose:    #E11D48;
  --accent-indigo:  #4F46E5;
  --accent-teal:    #0D9488;

  /* ── SIDEBAR SPECIFIC ──────────────────────── */
  --sidebar-bg:          #1E293B;
  --sidebar-border:      rgba(148, 163, 184, 0.1);
  --sidebar-item-hover:  rgba(248, 250, 252, 0.06);
  --sidebar-item-active: rgba(245, 158, 11, 0.12);
  --sidebar-text:        #94A3B8;
  --sidebar-text-active: #F8FAFC;
  --sidebar-icon-active: #F59E0B;
  --sidebar-width:       264px;

  /* ── TOPBAR SPECIFIC ───────────────────────── */
  --topbar-bg:      rgba(255, 255, 255, 0.95);
  --topbar-border:  #E2E8F0;
  --topbar-height:  64px;

  /* ── SHADOWS ───────────────────────────────── */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 4px 6px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(15, 23, 42, 0.06);
  --shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.08), 0 4px 6px rgba(15, 23, 42, 0.05);
  --shadow-xl: 0 20px 25px rgba(15, 23, 42, 0.10), 0 8px 10px rgba(15, 23, 42, 0.06);
  --shadow-card:   0 0 0 1px var(--border-subtle), 0 2px 8px rgba(15, 23, 42, 0.06);
  --shadow-card-hover: 0 0 0 1px var(--border-default), 0 8px 24px rgba(15, 23, 42, 0.10);
  --shadow-modal:  0 25px 50px rgba(15, 23, 42, 0.20);
  --shadow-brand:  0 4px 14px rgba(245, 158, 11, 0.30);
  --shadow-blue:   0 4px 14px rgba(37, 99, 235, 0.25);

  /* ── BORDER RADIUS ─────────────────────────── */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;

  /* ── SPACING ───────────────────────────────── */
  --space-page-x: 32px;
  --space-page-y: 24px;
  --space-card-p: 24px;
  --space-section: 24px;

  /* ── TRANSITIONS ───────────────────────────── */
  --transition-fast:   150ms cubic-bezier(0.16, 1, 0.3, 1);
  --transition-normal: 200ms cubic-bezier(0.16, 1, 0.3, 1);
  --transition-slow:   300ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* ═══════════════ DARK MODE ═══════════════════ */
.dark {
  --bg-base:      #0C1220;
  --bg-subtle:    #0F172A;
  --bg-muted:     #1E293B;

  --surface-1:    #111827;
  --surface-2:    #1E293B;
  --surface-3:    #273549;
  --surface-overlay: rgba(15, 23, 42, 0.95);

  --border-subtle:  #1E293B;
  --border-default: #334155;
  --border-strong:  #475569;
  --border-focus:   #F59E0B;

  --text-heading:   #F1F5F9;
  --text-body:      #CBD5E1;
  --text-muted:     #64748B;
  --text-placeholder: #475569;
  --text-disabled:  #334155;
  --text-inverse:   #0F172A;

  --primary:        #FBBF24;
  --primary-hover:  #F59E0B;
  --primary-active: #D97706;
  --primary-subtle: rgba(251, 191, 36, 0.08);
  --primary-muted:  rgba(251, 191, 36, 0.15);
  --primary-text:   #FDE68A;

  --blue:          #3B82F6;
  --blue-hover:    #2563EB;
  --blue-subtle:   rgba(59, 130, 246, 0.08);
  --blue-text:     #93C5FD;

  --success:        #10B981;
  --success-hover:  #059669;
  --success-subtle: rgba(16, 185, 129, 0.08);
  --success-muted:  rgba(16, 185, 129, 0.15);
  --success-text:   #6EE7B7;

  --warning:        #F59E0B;
  --warning-hover:  #D97706;
  --warning-subtle: rgba(245, 158, 11, 0.08);
  --warning-muted:  rgba(245, 158, 11, 0.15);
  --warning-text:   #FCD34D;

  --error:          #EF4444;
  --error-hover:    #DC2626;
  --error-subtle:   rgba(239, 68, 68, 0.08);
  --error-muted:    rgba(239, 68, 68, 0.15);
  --error-text:     #FCA5A5;

  --info:           #06B6D4;
  --info-subtle:    rgba(6, 182, 212, 0.08);
  --info-muted:     rgba(6, 182, 212, 0.15);
  --info-text:      #67E8F9;

  --sidebar-bg:           #0C1220;
  --sidebar-border:       rgba(30, 41, 59, 0.8);
  --sidebar-item-hover:   rgba(241, 245, 249, 0.04);
  --sidebar-item-active:  rgba(251, 191, 36, 0.10);
  --sidebar-text:         #64748B;
  --sidebar-text-active:  #F1F5F9;
  --sidebar-icon-active:  #FBBF24;

  --topbar-bg:     rgba(12, 18, 32, 0.95);
  --topbar-border: rgba(30, 41, 59, 0.8);

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.30);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.40), 0 1px 2px rgba(0, 0, 0, 0.30);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.40), 0 2px 4px rgba(0, 0, 0, 0.30);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.45), 0 4px 6px rgba(0, 0, 0, 0.35);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.50), 0 8px 10px rgba(0, 0, 0, 0.40);
  --shadow-card:       0 0 0 1px var(--border-subtle), 0 2px 8px rgba(0, 0, 0, 0.40);
  --shadow-card-hover: 0 0 0 1px var(--border-default), 0 8px 24px rgba(0, 0, 0, 0.50);
  --shadow-modal:      0 25px 50px rgba(0, 0, 0, 0.60);
  --shadow-brand:      0 4px 14px rgba(251, 191, 36, 0.25);
  --shadow-blue:       0 4px 14px rgba(59, 130, 246, 0.25);
}
```

**السبب:** اللون الأصفر `#F59E0B` ده هوية تاكسي الحقيقية. الأزرق يبقى للأكشن والبيانات. كده الهوية البصرية أقوى وأوضح.

---

## 2. الطباعة والخطوط

### المشاكل الموجودة

**مشكلة 1 — مفيش Font Import:**
في `globals.css` و `layout.tsx` مفيش import لأي Google Font. الكود بيستخدم `font-family: 'Cairo', sans-serif` في charts.tsx و `font-family: 'IBM Plex Mono'` في globals.css بس مش متحملين فعلياً!

```tsx
// في layout.tsx — مفيش next/font أو Google Fonts!
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>   // ← مفيش font class
    </html>
  )
}
```

**مشكلة 2 — عدم اتساق أحجام الخطوط:**
الصفحات بتستخدم:
- `text-2xl font-black` — Page titles
- `text-[13px]` — Small labels
- `text-[12px]` — Table headers
- `text-[11px]` — Badges
- `text-[10px]` — Tiny labels
- `text-[9px]` — Notification badge

كل ده arbitrary values بدون type scale محدد.

**مشكلة 3 — `page-title` كلاس موجود في globals.css لكن مش مستخدم:**
```css
/* في globals.css */
.page-title { font-size: 22px; font-weight: 700; }
.page-subtitle { font-size: 14px; }
```
بس الصفحات بتكتب `text-2xl font-black` بدل `.page-title`.

---

### ✅ الحل — أضف في `layout.tsx`

```tsx
import { Cairo, IBM_Plex_Mono } from "next/font/google";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${ibmMono.variable} font-cairo`}>
        {children}
      </body>
    </html>
  );
}
```

ثم في `globals.css`:
```css
body {
  font-family: var(--font-cairo), 'Cairo', 'Segoe UI', system-ui, sans-serif;
}
.mono, code, pre {
  font-family: var(--font-mono), 'IBM Plex Mono', 'Courier New', monospace;
}
```

---

### نظام الـ Type Scale المقترح

```css
/* إضافة في globals.css */
:root {
  --text-xs:    11px;   /* badges, tiny labels */
  --text-sm:    12px;   /* table cells, secondary */
  --text-base:  14px;   /* body text */
  --text-md:    15px;   /* medium emphasis */
  --text-lg:    16px;   /* card titles */
  --text-xl:    18px;   /* section headings */
  --text-2xl:   20px;   /* page subtitles */
  --text-3xl:   24px;   /* page titles */
  --text-4xl:   30px;   /* hero numbers */

  --weight-normal:   400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;
  --weight-extrabold: 800;
  --weight-black:    900;
}
```

---

## 3. المكوّنات المشتركة

### 3.1 السايدبار — `sidebar.tsx` vs `dashboard-shell.tsx`

#### المشكلة الجوهرية

عندك **تكرار كامل** — ملفين يعملوا نفس الحاجة:
- `sidebar.tsx` — الملف المخصص، ديزاين احترافي، glow effects، لكن **مش مستخدم في أي صفحة**
- `dashboard-shell.tsx` — السايدبار المستخدم فعلياً، ديزاين بسيط

**الحل:** احذف `dashboard-shell.tsx` أو حوّله ليستخدم `sidebar.tsx`، واعمل دمج كامل.

#### مشاكل `sidebar.tsx` الحالية

| المشكلة | الوصف | الإصلاح |
|---------|-------|---------|
| لون الخلفية هاردكود | `rgba(10,22,40,0.95)` | استخدم `var(--sidebar-bg)` |
| اتجاه الـ active indicator | `ChevronLeft` لكن السايدبار RTL | استخدم `ChevronRight` |
| لا يوجد tooltip للأسماء | عند collapse مفيش tooltip | أضف `title` attribute |
| الـ logo مش responsive | ثابت `w-11 h-11` | أضف responsive sizes |
| مفيش collapse mode | السايدبار دايماً مفتوح | أضف icon-only collapse |
| الـ version text صغير جداً | `text-[10px]` | `text-xs` |

#### كود `sidebar.tsx` المحسّن (الأجزاء الحرجة)

```tsx
// ❌ القديم
<aside
  className="hidden lg:flex flex-col sticky top-0 h-screen border-l border-divider"
  style={{
    width: "var(--sidebar-width)",
    background: "linear-gradient(180deg, rgba(10,22,40,0.95) 0%, rgba(7,15,28,0.98) 100%)",
    // ...hardcoded dark colors
  }}
>

// ✅ الجديد
<aside
  className={cn(
    "hidden lg:flex flex-col sticky top-0 h-screen",
    "border-l transition-all duration-300",
  )}
  style={{
    width: "var(--sidebar-width)",
    background: "var(--sidebar-bg)",
    borderColor: "var(--sidebar-border)",
    boxShadow: "var(--shadow-lg)",
  }}
>
```

---

### 3.2 الـ TopBar — `topbar.tsx`

#### المشاكل

**مشكلة 1 — خلفية هاردكود:**
```tsx
// ❌ القديم
style={{ background: "rgba(4, 8, 16, 0.85)" }}

// ✅ الجديد
style={{ background: "var(--topbar-bg)", borderColor: "var(--topbar-border)" }}
```

**مشكلة 2 — الـ Settings button بيروح `/dashboard` مش `/settings`:**
```tsx
// ❌
<Link href="/dashboard">
  <Settings size={15} />
</Link>

// ✅
<Link href="/dashboard/settings" title="الإعدادات">
  <Settings size={15} />
</Link>
```

**مشكلة 3 — تاريخ اليوم مش معمول له lazy loading:**
```tsx
// ❌ بيتحسب في كل render
const today = new Date().toLocaleDateString(...)

// ✅
// ضعه في Suspense boundary أو استخدم cache
```

**مشكلة 4 — الـ search bar (`TopBarSearch`) مش مرئي في اللقطات:**
وبنظر للكود في `topbar-search.tsx` المكوّن بيعمل search في الصفحات المختلفة. لكن **مفيش placeholder أو hint للمستخدم** إيه الـ scope بتاع الـ search. أضف:
```tsx
placeholder="ابحث في الرحلات، المستخدمين، السائقين..."
```

#### TopBar المقترح الكامل

```tsx
<header
  className="sticky top-0 z-30 backdrop-blur-xl"
  style={{
    height: "var(--topbar-height)",
    background: "var(--topbar-bg)",
    borderBottom: "1px solid var(--topbar-border)",
    boxShadow: "var(--shadow-sm)",
  }}
>
  <div className="flex items-center h-full px-6 gap-4">
    
    {/* Breadcrumb - مقترح جديد */}
    <Breadcrumb /> {/* يوضح للمستخدم إيه الصفحة دي وفين هو */}
    
    <div className="flex-1" />
    
    {/* Search */}
    <TopBarSearch />
    
    {/* Actions */}
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <LanguageSwitcher />
      <NotificationBell count={unreadCount} />
      <UserMenu user={userName} initial={userInitial} />
    </div>
  </div>
</header>
```

---

### 3.3 بطاقات الإحصاء — `stat-card.tsx`

#### المشاكل الموجودة

**مشكلة 1 — الـ border و shadow هاردكود:**
```tsx
// ❌ القديم
border: `1px solid rgba(255,255,255,0.05)`  // ← مش شايف في Light Mode
boxShadow: "0 2px 12px rgba(0,0,0,0.3)"    // ← تقيل جداً في Light Mode

// ✅ الجديد
border: "1px solid var(--border-subtle)"
boxShadow: "var(--shadow-card)"
```

**مشكلة 2 — الـ top accent line ضعيف:**
```tsx
// ❌ opacity 0.6 — مش واضح
opacity: 0.6,

// ✅ opacity كامل مع gradient أوضح
opacity: 1,
background: `linear-gradient(90deg, transparent 0%, ${accentColor} 40%, ${accentColor} 60%, transparent 100%)`
```

**مشكلة 3 — الـ value text مش موحد:**
`text-3xl font-black` — الـ 3xl مقياس tailwind وده يساوي `30px`. كده الأرقام الكبيرة زي `1,234,567` بتطلع مشوّشة. الأحسن:

```tsx
// ✅ استخدم clamp لـ responsive
style={{
  fontSize: "clamp(22px, 2.5vw, 32px)",
  fontWeight: 900,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.03em",
}}
```

**مشكلة 4 — مفيش loading skeleton:**
الكارد مش بيعمل skeleton لما البيانات بتتحمل. أضف:
```tsx
interface StatCardProps {
  // ...existing props
  isLoading?: boolean;
}

// في الـ render
if (isLoading) {
  return (
    <div className="rounded-2xl animate-pulse" style={{ height: "140px", background: "var(--surface-2)" }}>
      <div className="p-5 space-y-4">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-8 w-16 rounded" />
        <div className="skeleton h-2 w-32 rounded" />
      </div>
    </div>
  )
}
```

**مشكلة 5 — مفيش `subtitle` في كل الكاردات:**
البروب `subtitle` موجود لكن بس اتستخدم في كارد واحدين. وسّع استخدامه.

#### كارد الإحصاء المقترح

```tsx
// stat-card.tsx — الكود المحدّث الكامل
export function StatCard({
  title, value, icon, trend, className,
  accentColor = "#F59E0B",  // Brand yellow default
  isLoading = false,
  href,
}: StatCardProps) {
  const Wrapper = href ? Link : "div";

  if (isLoading) return <StatCardSkeleton />;

  return (
    <Wrapper
      href={href!}
      className={cn(
        "group relative rounded-xl overflow-hidden transition-all duration-200",
        href && "cursor-pointer",
        className
      )}
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card-hover)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 inset-x-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: "var(--text-muted)" }}>
            {title}
          </p>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        </div>

        <div
          className="text-[28px] font-black tracking-tight num leading-none"
          style={{ color: "var(--text-heading)" }}
        >
          {value}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 mt-3">
            <span
              className={cn("text-xs font-bold flex items-center gap-0.5",
                trend.direction === "up" ? "text-success" : "text-error")}
            >
              {trend.direction === "up" ? "↑" : "↓"} {trend.value}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
```

---

### 3.4 الـ DataTable — `data-table.tsx`

#### المشاكل

**مشكلة 1 — الهيدر مش له خلفية:**
```tsx
// ❌ القديم
<tr className="border-b border-divider/60">
  <th className="text-right py-3 px-4 text-text-secondary text-[12px] font-medium">

// ✅ الجديد — خلفية خفيفة للهيدر
<tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border-default)" }}>
  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider"
      style={{ color: "var(--text-muted)" }}>
```

**مشكلة 2 — الـ empty state ضعيف:**
```tsx
// ❌ القديم
<div className="text-center py-12 text-text-disabled">{emptyMessage}</div>

// ✅ الجديد — empty state مع أيقونة
<div className="flex flex-col items-center justify-center py-16 gap-3">
  <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
    <InboxIcon size={20} className="text-muted" />
  </div>
  <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
    {emptyMessage}
  </p>
</div>
```

**مشكلة 3 — الـ Pagination مش بيوضح عدد الصفحات الكلي:**
```tsx
// ❌ بيعمل max 5 صفحات فقط
Array.from({ length: Math.min(totalPages, 5) }, ...)

// ✅ Pagination ذكي مع ellipsis
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total-4, total-3, total-2, total-1, total];
  return [1, "...", current-1, current, current+1, "...", total];
}
```

**مشكلة 4 — مفيش sort functionality:**
الجدول مفيش headers قابلة للضغط للـ sorting. أضف:
```tsx
interface TableHeader {
  label: string;
  key: string;
  sortable?: boolean;
}

// في الـ th
{h.sortable && (
  <button onClick={() => onSort(h.key)} className="inline-flex items-center gap-1">
    {h.label}
    <ArrowUpDown size={12} className="opacity-40" />
  </button>
)}
```

**مشكلة 5 — مفيش row selection:**
في بعض الصفحات محتاجين يعملوا bulk actions. أضف checkbox.

---

### 3.5 الـ Badge — `badge.tsx`

#### المشاكل

**مشكلة 1 — الـ dot glow مش صحيح في Light Mode:**
```tsx
// ❌ القديم
style={{ boxShadow: `0 0 5px ${v.glow}` }}
// في light mode الـ glow بيظهر غريب

// ✅ الجديد — glow بس في dark mode
className="dark:shadow-[0_0_5px_var(--glow)]"
```

**مشكلة 2 — مفيش `orange` variant:**
كتير من الـ pages بتعمل status badges بألوان برتقالي (revision requests, etc.) بس مفيش variant جاهز.

```tsx
// أضف في variants
orange: {
  cls: "bg-orange-500/10 text-orange-400 border-orange-500/25",
  dotColor: "bg-orange-400",
  glow: "rgba(249,115,22,0.3)",
},
```

**مشكلة 3 — الـ Badge مش Accessible:**
مفيش `role="status"` أو `aria-label`.

---

### 3.6 الـ Modal — `modal.tsx`

#### المشاكل

**مشكلة 1 — مفيش animation:**
الـ modal بيظهر فجأة بدون transition.
```tsx
// ✅ أضف animation
<div
  className="relative animate-scale-in"
  style={{ ... }}
>
```

**مشكلة 2 — مفيش keyboard trap:**
لما الـ modal مفتوح، الـ Tab button بيروح لعناصر وراه. محتاج `focus-trap`.

**مشكلة 3 — مفيش `XL` size:**
```tsx
// ✅ أضف xl size
const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",   // ← جديد
};
```

**مشكلة 4 — الـ footer للأزرار مفيش:**
كل modal بيحط الأزرار يدوي في `children`. أضف `footer` prop:
```tsx
interface ModalProps {
  // ...
  footer?: React.ReactNode;
}

// في الـ render
{footer && (
  <div className="flex items-center justify-end gap-3 mt-6 pt-5"
       style={{ borderTop: "1px solid var(--border-subtle)" }}>
    {footer}
  </div>
)}
```

---

### 3.7 الـ Charts — `charts.tsx`

#### المشاكل

**مشكلة 1 — الـ ChartCard خلفيته هاردكود:**
```tsx
// ❌
background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)",
border: "1px solid rgba(255,255,255,0.05)",
boxShadow: "0 2px 12px rgba(0,0,0,0.3)"

// ✅
background: "var(--surface-1)",
border: "1px solid var(--border-subtle)",
boxShadow: "var(--shadow-card)"
```

**مشكلة 2 — `TOOLTIP_STYLE` هاردكود للـ dark mode:**
```tsx
// ❌ دايماً داكن
backgroundColor: "rgba(7, 15, 28, 0.95)",
color: "#F0F6FF",

// ✅ استخدم CSS variables
const TOOLTIP_STYLE = {
  backgroundColor: "var(--surface-overlay)",
  border: "1px solid var(--border-default)",
  color: "var(--text-body)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-lg)",
};
```

**مشكلة 3 — الـ BarChart بيستخدم لونين فقط:**
```tsx
// ❌ index 0 → blue, index 1 → green
fill={index === 0 ? "url(#barGradient)" : "url(#barGradient2)"}

// ✅ لو عندك أكتر من نوعين مركبة بيطلع mono-color
// الأحسن تعمل color array ديناميكي
const CHART_COLORS = ["#F59E0B","#3B82F6","#10B981","#8B5CF6","#06B6D4"];
```

**مشكلة 4 — مفيش empty state للـ charts:**
لو البيانات `data.length === 0` بيعمل div بسيط. الأحسن:
```tsx
// ✅ Empty state احترافي
<div className="h-64 flex flex-col items-center justify-center gap-3">
  <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
    <BarChart3 size={20} style={{ color: "var(--text-muted)" }} />
  </div>
  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
    لا توجد بيانات كافية لعرض الرسم البياني
  </p>
</div>
```

**مشكلة 5 — مفيش LineChart:**
لوحة التحكم محتاجة trend chart يوضح نمو الرحلات والإيرادات على مدار الوقت. أضف `TrendChart` component.

---

## 4. تحليل الصفحات

### 4.1 صفحة تسجيل الدخول — `login/page.tsx`

#### ما هو ممتاز ✅
- تصميم واجهة جيد، ambient blobs للخلفية
- دعم RTL/LTR
- عرض رسالة الخطأ بشكل واضح

#### المشاكل ❌

**مشكلة 1 — الـ Blobs مش بتتحرك:**
```tsx
// ❌ animation: "float 12s ease-in-out infinite"
// لكن @keyframes float مش معرفة في globals.css!

// ✅ أضف في globals.css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33%       { transform: translateY(-20px) rotate(1deg); }
  66%       { transform: translateY(10px) rotate(-1deg); }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%       { opacity: 0.7; transform: scale(1.05); }
}
```

**مشكلة 2 — `animate-pulse-glow` مش معرّف:**
```tsx
// ❌ في login
className="... animate-pulse-glow"
// لكن الـ keyframes مش موجودة!
```

**مشكلة 3 — الكارد مفيش footer links:**
مفيش "نسيت كلمة السر؟" — حتى لو ما بتوفر الميزة دي دلوقتي، اعمل placeholder.

**مشكلة 4 — الـ Form مش بيعمل autofocus:**
```tsx
// ✅ أضف autoFocus
<input
  type="email"
  autoFocus
  autoComplete="email"
  ...
/>
```

**مشكلة 5 — مقاسات الـ Card:**
`max-w-[420px]` — ده صغير شوية على الـ Desktop. الأحسن `max-w-[440px] sm:max-w-[460px]`.

**مشكلة 6 — لا يوجد "Remember me" checkbox:**
لعمل تجربة أفضل.

**الشكل المقترح للكارد:**
```
┌─────────────────────────────────────┐
│           ⚡ تاكسي                    │
│    لوحة تحكم النظام المتكامل         │
├─────────────────────────────────────┤
│                                     │
│  البريد الإلكتروني                  │
│  ┌───────────────────────────────┐  │
│  │  admin@taxi.com              │  │
│  └───────────────────────────────┘  │
│                                     │
│  كلمة المرور                        │
│  ┌───────────────────────────────┐  │
│  │  ●●●●●●●●●●              👁  │  │
│  └───────────────────────────────┘  │
│  ☐ تذكرني         نسيت كلمة المرور؟│
│                                     │
│  ┌───────────────────────────────┐  │
│  │        تسجيل الدخول  ←       │  │
│  └───────────────────────────────┘  │
│                                     │
│  🔒 بيانات مشفرة وآمنة              │
└─────────────────────────────────────┘
```

---

### 4.2 صفحة لوحة التحكم الرئيسية — `dashboard/page.tsx`

#### ما هو ممتاز ✅
- إحصاءات 4 كاردات رئيسية
- Quick Metrics row
- Charts
- Recent Trips table

#### المشاكل ❌

**مشكلة 1 — بيجيب كل الرحلات `trips` بدون pagination:**
```tsx
// ❌ بيجيب كل الرحلات من قاعدة البيانات!
supabase.from("trips").select("id, status, price, created_at, vehicle_type")
// لو في 100,000 رحلة؟ هيبطّئ التطبيق جداً

// ✅ استخدم aggregate queries
const { data: tripStats } = await supabase
  .rpc('get_trip_stats')  // أو
  .from("trips")
  .select("status, price")
  .gte("created_at", startOfMonth)  // filter بالشهر الحالي
```

**مشكلة 2 — الـ Quick Metrics inline styles:**
```tsx
// ❌ كل metric بيعمل inline style في array.map
className={`flex items-center gap-3 p-4 rounded-xl ${item.bg} border ${item.border}...`}

// ✅ استخدم StatCard الموجود أو MetricChip component منفصل
```

**مشكلة 3 — Recent Trips table مفيش loading state:**
لو البيانات تأخرت، مفيش skeleton يظهر للمستخدم.

**مشكلة 4 — الصفحة مفيش Refresh button:**
Dashboard بيانات إحصائية محتاج زر Refresh أو auto-refresh كل X دقيقة.

**مشكلة 5 — مفيش Welcome message:**
```tsx
// ✅ أضف greeting section
<div className="bg-gradient-to-r from-primary-subtle to-blue-subtle rounded-xl p-5 flex items-center justify-between">
  <div>
    <h2 className="text-lg font-bold">مرحباً، {adminName} 👋</h2>
    <p className="text-sm text-muted mt-1">آخر دخول: {lastLogin}</p>
  </div>
  <div className="text-4xl">🚖</div>
</div>
```

---

### 4.3 صفحة المستخدمين — `dashboard/users/`

#### ما هو ممتاز ✅
- Filters: role, status, search
- Block/Unblock modal
- Role change modal
- Pagination

#### المشاكل ❌

**مشكلة 1 — `selectStyle` بيستخدم `var(--surface-glass)` غير المعرّف:**
```tsx
// ❌
const selectStyle = {
  background: "var(--surface-glass)",  // ← مش موجود في الـ Design System الجديد!
}

// ✅
const selectStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-body)",
}
```

**مشكلة 2 — جدول المستخدمين مفيش User Avatar:**
كل صف فيه اسم بس مفيش avatar أو initial. أضف:
```tsx
<td className="py-3 px-4">
  <div className="flex items-center gap-3">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: getAvatarGradient(user.id) }}
    >
      {user.name?.charAt(0)}
    </div>
    <div>
      <div className="font-medium text-sm">{user.name}</div>
      <div className="text-xs text-muted">{user.email}</div>
    </div>
  </div>
</td>
```

**مشكلة 3 — Block Modal بيستخدم `alert()` للـ error:**
```tsx
// ❌
alert("حدث خطأ: " + result.error);

// ✅ استخدم toast notification أو error state في الـ modal
setError(result.error);
```

**مشكلة 4 — الجدول مفيش column للـ Phone:**
`phone` موجود في الـ interface لكن مش بيتعرض في الجدول.

**مشكلة 5 — Filter status محتاج "Active" و"Inactive" بالإضافة لـ "Blocked":**
الكود الحالي عنده `filterStatus` لكن مش واضح إيه القيم المتاحة في الـ UI.

---

### 4.4 صفحة السائقين — `dashboard/drivers/`

#### ما هو ممتاز ✅
- Tabs system: Pending, Approved, Blocked, Revision
- Counts على كل tab
- Color-coded tabs
- Search by name/plate/national ID

#### المشاكل ❌

**مشكلة 1 — الـ Tabs مش مـ حالة active صح في لما الـ count = 0:**
لو مفيش سائقين pending، الـ count badge بيختفي — كده الـ tab بيبدو فارغ بدون سبب واضح.

**مشكلة 2 — الـ Tab styling معمول بـ `<a>` مش `<Link>`:**
```tsx
// ❌
<a href={`/dashboard/drivers?tab=${t.key}`}>

// ✅
<Link href={`/dashboard/drivers?tab=${t.key}`}>
```
الـ `<a>` بتعمل full page reload، اللينك بيعمل client navigation.

**مشكلة 3 — جدول السائقين في `drivers/page.tsx` طويل جداً:**
صورة الـ national ID، صورة الرخصة، الصورة الجنائية — كلها بتتعرض في نفس الجدول. الأحسن:
- الجدول يعرض المعلومات الأساسية فقط
- صفحة التفاصيل `/drivers/[id]` تعرض الصور والوثائق

**مشكلة 4 — صفحة `/drivers/[id]` مفيش قسم الرحلات السابقة:**
لما تعرض تفاصيل السائق، يجب تعرض آخر X رحلاته.

**مشكلة 5 — Revision tab مفيش عرض واضح للـ fields_requested:**
```tsx
// ❌ الكود بيعرض revision.fields_requested بدون formatting
{revision.fields_requested}

// ✅ الأحسن تعرضه كـ chips/tags
{JSON.parse(revision.fields_requested || "[]").map((field) => (
  <span key={field} className="badge badge-warning">{field}</span>
))}
```

---

### 4.5 صفحة الرحلات — `dashboard/trips/`

#### ما هو ممتاز ✅
- Status filter و Vehicle filter
- Total count + Revenue display
- Pagination

#### المشاكل ❌

**مشكلة 1 — مفيش Date Range filter:**
الصفحة بتعرض كل الرحلات بدون filter تاريخي. أضف:
```tsx
// Date picker range
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
```

**مشكلة 2 — مفيش Search بالـ Pickup/Destination:**
المستخدم عايز يدور على رحلة برقم أو بالعنوان.

**مشكلة 3 — `user_id` و `driver_id` بيتعرضوا بدون اسم:**
```tsx
// في بعض الأماكن بيتعرض ID مش اسم
// لأن userMap.get() ممكن يرجع undefined
<td>{userMap.get(trip.user_id) ?? trip.user_id}</td>

// ✅ أحسن
<td>{userMap.get(trip.user_id) ?? <span className="text-muted text-xs">—</span>}</td>
```

**مشكلة 4 — صفحة `/trips/[id]` مفيش Map لمسار الرحلة:**
لوحة التفاصيل محتاجة خريطة توضح الـ pickup والـ destination (ممكن static map من Mapbox أو Google).

**مشكلة 5 — `totalRevenue` بيتحسب على الصفحة الحالية فقط:**
```tsx
// ❌ بيحسب revenue الرحلات اللي في الصفحة الحالية (10 رحلات) مش كل الرحلات
const totalRevenue = (trips || [])
  .filter((t) => t.status === "completed")
  .reduce((s, t) => s + ..., 0);

// ✅ محتاج aggregate query منفصل
const { data: revenueData } = await supabase
  .rpc('get_revenue_total', { status_filter: statusFilter })
```

---

### 4.6 صفحة الشكاوي — `dashboard/complaints/`

#### ما هو ممتاز ✅
- Filters: Status, Priority, Category
- صفحة تفاصيل كل شكوى مع reply form

#### المشاكل ❌

**مشكلة 1 — مفيش Priority badge في الجدول:**
الجدول بيعرض الشكوى لكن مش واضح priority كل شكوى بصرياً.

**مشكلة 2 — الـ Reply form مفيش character counter:**
```tsx
// ✅ أضف
<textarea ... maxLength={500} />
<div className="text-xs text-right text-muted mt-1">
  {reply.length}/500
</div>
```

**مشكلة 3 — مفيش Assign to Admin:**
الشكاوي مفيش نظام assignment — مين مسؤول عن الشكوى دي؟

**مشكلة 4 — الـ complaint detail page لما تغلق الشكوى مفيش confirmation modal:**
```tsx
// ❌ بيحفظ مباشرة
if (res.ok) { setSaved(true); setTimeout(() => router.push("..."), 1200) }

// ✅ لو status = "closed" أطلب confirmation
if (status === "closed") {
  const confirmed = await showConfirmModal("هل أنت متأكد من إغلاق الشكوى؟");
  if (!confirmed) return;
}
```

---

### 4.7 صفحة الكوبونات — `dashboard/coupons/`

#### ما هو ممتاز ✅
- Modal لإنشاء كوبون
- Validation أساسية
- Toggle active/inactive

#### المشاكل ❌

**مشكلة 1 — الـ Coupon creation button لونه `amber` لكن باقي الصفحة ألوانها مختلفة:**
```tsx
// ❌ اللون الأصفر isolated في صفحة واحدة
background: "linear-gradient(135deg, #F59E0B, #D97706)"

// ✅ لما نحول الـ Primary Color لـ Yellow، ده هيبقى consistent تلقائياً
background: "var(--primary)"
```

**مشكلة 2 — الـ `alert()` للـ error:**
```tsx
// ❌ في 3 أماكن في الملف ده
alert("حدث خطأ: " + result.error);

// ✅ Toast notification
```

**مشكلة 3 — مفيش Copy to Clipboard للـ coupon code:**
```tsx
// ✅ أضف زر copy
<button onClick={() => navigator.clipboard.writeText(coupon.code)}>
  <Copy size={13} />
</button>
```

**مشكلة 4 — الـ Expiry Date مش بتعرض بشكل جميل:**
`2025-12-31T00:00:00` بتتعرض كده بالضبط في الجدول. استخدم `formatDate()`.

**مشكلة 5 — مفيش Usage Stats:**
الكوبون كم مرة اتستخدم؟ مفيش `current_uses` في العرض.

---

### 4.8 صفحة الإشعارات — `dashboard/notifications/`

#### ما هو ممتاز ✅
- Filter by type
- Modal لإرسال إشعار جديد
- Mark as read functionality

#### المشاكل ❌

**مشكلة 1 — مفيش Bulk Mark All as Read:**
```tsx
// ✅ أضف زر
<button onClick={markAllAsRead} className="btn btn-ghost text-xs">
  تحديد الكل كمقروء
</button>
```

**مشكلة 2 — الـ Send Notification modal مفيش Target selection:**
الإشعار بيتبعت لـ "كل المستخدمين"؟ أم لمجموعة محددة؟ أم لمستخدم واحد؟ مفيش خيارات.

**مشكلة 3 — مفيش Preview قبل الإرسال:**
قبل ما تبعت إشعار لكل المستخدمين، لازم تكون في confirmation step.

**مشكلة 4 — الـ type filter مفيش "All" option selected بشكل صحيح:**
```tsx
// ❌ عند تحميل الصفحة بدون type param، الـ select مش بيعمل select على "كل الأنواع"
value={currentType}  // = "" لكن option value = ""
// ده صح technically لكن يحتاج اختبار
```

---

### 4.9 صفحة التسعير — `dashboard/pricing/`

#### ما هو ممتاز ✅
- Edit/Add vehicle types with pricing
- Color selector للـ brand color
- Toggle active/inactive

#### المشاكل ❌

**مشكلة 1 — مفيش Real-time Preview للـ pricing formula:**
لما المستخدم يحط `base_fare` و `price_per_km`، عرضله تقدير للأسعار:
```tsx
// ✅ أضف Price Calculator
const estimatedPrice = (distance: number) =>
  form.base_fare + (form.price_per_km * distance);

<div className="p-3 rounded-xl bg-primary-subtle mt-3">
  <p className="text-xs font-bold">تقدير الأسعار:</p>
  <p>5 كم: {estimatedPrice(5)} ج.م</p>
  <p>10 كم: {estimatedPrice(10)} ج.م</p>
  <p>20 كم: {estimatedPrice(20)} ج.م</p>
</div>
```

**مشكلة 2 — `COLORS` array صغيرة (8 ألوان فقط):**
أضف المزيد أو استخدم color picker حقيقي:
```tsx
// ✅ أضف color picker native
<input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} />
```

**مشكلة 3 — مفيش Pricing History:**
لما يعدل السعر، مفيش سجل للتعديلات السابقة.

---

### 4.10 صفحة أنواع المركبات — `dashboard/vehicle-types/`

> **ملاحظة:** صفحة `vehicle-types` و صفحة `pricing` بيعملوا نفس الحاجة تقريباً! كلاهما بيتعامل مع `vehicle_types` table. **يجب دمجهم في صفحة واحدة**.

#### المشاكل ❌

**مشكلة 1 — تكرار في `pricing/pricing-client.tsx` و `vehicle-types/vehicle-types-client.tsx`:**
- كلاهما عندهم نفس `VehicleType` interface
- كلاهما عندهم نفس form fields
- كلاهما بيعملوا نفس API calls

```
// ✅ دمج الصفحتين في:
/dashboard/vehicle-types → إدارة أنواع المركبات والتسعير معاً
```

**مشكلة 2 — الـ sort_order مفيش drag-and-drop:**
`GripVertical` icon موجود في الكود لكن الـ drag functionality مش مطبقة.

---

### 4.11 صفحة التقييمات — `dashboard/ratings/`

#### ما هو ممتاز ✅
- Stats: إجمالي، متوسط، 5 نجوم، 1-2 نجوم
- Filter by driver و by min_rating

#### المشاكل ❌

**مشكلة 1 — مفيش Star Display بالمنظر الصحيح:**
```tsx
// ❌ بيعرض الرقم فقط
<td>{rating.rating}/5</td>

// ✅ عرض نجوم حقيقية
<div className="flex items-center gap-0.5">
  {Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      size={13}
      fill={i < rating.rating ? "currentColor" : "none"}
      style={{ color: i < rating.rating ? "#F59E0B" : "var(--border-default)" }}
    />
  ))}
</div>
```

**مشكلة 2 — الـ Rating Distribution Chart مفيش:**
مفيش horizontal bar chart يوضح توزيع التقييمات (كم 5 نجوم vs 1 نجمة).

```tsx
// ✅ أضف RatingDistribution component
{[5, 4, 3, 2, 1].map((stars) => (
  <div key={stars} className="flex items-center gap-3">
    <span className="text-xs w-4">{stars}</span>
    <Star size={12} fill="currentColor" className="text-amber-400" />
    <div className="flex-1 bg-surface-2 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-amber-400"
        style={{ width: `${(ratingCounts[stars] / totalRatings) * 100}%` }}
      />
    </div>
    <span className="text-xs text-muted w-8">{ratingCounts[stars]}</span>
  </div>
))}
```

---

### 4.12 صفحة الرسائل — `dashboard/messages/`

#### ما هو ممتاز ✅
- Avatar gradient colors لكل مستخدم
- Card-based layout بدل table

#### المشاكل ❌

**مشكلة 1 — الرسائل read-only، مفيش reply:**
الأدمن يشوف الرسائل بس مش يرد عليها؟ لو ده مقصود، أضف label "للمراجعة فقط".

**مشكلة 2 — مفيش Search في الرسائل:**
مع الوقت، الرسائل هتتراكم. لازم search.

**مشكلة 3 — مفيش Filter بين مقروء/غير مقروء:**

**مشكلة 4 — الـ Avatar gradient بيتحدد بـ `index % 5`:**
```tsx
// ❌ بيتغير الـ gradient لما تتقلب الصفحات (index يتغير)
const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

// ✅ استخدم user.id لتحديد اللون ثابت
const getAvatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
```

---

### 4.13 صفحة مواقع السائقين — `dashboard/driver-locations/`

#### المشاكل ❌

**مشكلة 1 — مفيش خريطة حقيقية:**
الصفحة بتعرض lat/lng كأرقام في جدول. ده مفيدش للعملية. **يجب إضافة Map Component.**

```tsx
// ✅ استخدم React Leaflet أو Mapbox GL JS
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

<MapContainer center={[30.0444, 31.2357]} zoom={11} style={{ height: "500px" }}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {locations.map((loc) => (
    <Marker key={loc.id} position={[loc.lat, loc.lng]}>
      <Popup>{driverMap.get(loc.driver_id)?.name}</Popup>
    </Marker>
  ))}
</MapContainer>
```

**مشكلة 2 — `isOnline` بيستخدم 5 دقائق threshold:**
ده معقول، لكن لازم يكون configurable:
```tsx
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes - make this a constant
```

**مشكلة 3 — الصفحة مفيش Auto Refresh:**
مواقع السائقين بتتغير كل ثانية. الصفحة يجب تعمل auto-refresh:
```tsx
// ✅
useEffect(() => {
  const interval = setInterval(() => router.refresh(), 30_000); // كل 30 ثانية
  return () => clearInterval(interval);
}, []);
```

---

### 4.14 صفحة سجل المشرفين — `dashboard/admin-logs/`

#### ما هو ممتاز ✅
- Color-coded actions: create=green, delete=red, etc.
- Filter by admin و action
- Pagination

#### المشاكل ❌

**مشكلة 1 — الـ `metadata` column (JSON) بيتعرض كنص raw:**
```tsx
// ❌
<td>{JSON.stringify(log.metadata)}</td>

// ✅ عرض structured مع collapse
<details>
  <summary className="cursor-pointer text-xs text-muted">عرض التفاصيل</summary>
  <pre className="text-xs mt-2 p-2 rounded bg-surface-2">
    {JSON.stringify(log.metadata, null, 2)}
  </pre>
</details>
```

**مشكلة 2 — مفيش Date filter:**
السجل بيتضخم مع الوقت. أضف date range filter.

**مشكلة 3 — مفيش Export CSV:**
الأدمن محتاج يصدّر السجل كـ CSV للمراجعة.

---

### 4.15 صفحة عروض الرحلات — `dashboard/trip-offers/`

#### المشاكل ❌

**مشكلة 1 — Response time مش بيتعرض:**
`responded_at - created_at` يعطي وقت استجابة السائق. ده مؤشر مهم جداً.

**مشكلة 2 — مفيش Driver Performance:**
من هذه الصفحة ممكن تستنتج أي سائقين بيرفضوا الرحلات أكتر من غيرهم.

---

## 5. المشاكل الحرجة

### 🔴 Critical — يجب إصلاحها فوراً

| # | المشكلة | الملف | الأثر |
|---|---------|-------|-------|
| 1 | `sidebar.tsx` غير مستخدم، `dashboard-shell.tsx` هو الفعلي | جميع الصفحات | ديزاين غير متسق |
| 2 | خلفية TopBar وSidebar هاردكود dark | `topbar.tsx`, `sidebar.tsx` | Light mode معطوب |
| 3 | `rgba(255,255,255,0.05)` كـ border في Light mode | `stat-card.tsx`, `charts.tsx` | Cards غير مرئية في Light mode |
| 4 | `@keyframes float` و `animate-pulse-glow` مش معرّفين | `globals.css`, `login/page.tsx` | Login animation مكسورة |
| 5 | `alert()` بدل proper error handling | `coupons-client.tsx`, others | UX رديء |
| 6 | Font Cairo غير محمّل | `layout.tsx` | Fallback font بيظهر |
| 7 | Dashboard page بيجيب كل الرحلات بدون limit | `dashboard/page.tsx` | Performance issue |
| 8 | `var(--surface-glass)` مش معرّف في Design System | متعدد الملفات | Console errors |

### 🟡 Important — إصلاح في الجولة القادمة

| # | المشكلة | الملف | الأثر |
|---|---------|-------|-------|
| 9 | تكرار `vehicle-types` و `pricing` pages | كلاهما | Code duplication |
| 10 | Pagination بتعرض max 5 صفحات فقط | `data-table.tsx` | UX issue لو في 100+ صفحة |
| 11 | مفيش Toast notification system | كل الصفحات | Success/Error messages |
| 12 | مفيش Loading skeletons | Dashboard, Tables | Perceived performance |
| 13 | مفيش Breadcrumb navigation | Layout | User orientation |
| 14 | مواقع السائقين بدون خريطة | `driver-locations/page.tsx` | Core feature missing |
| 15 | `<a>` بدل `<Link>` في tabs | `drivers/page.tsx` | Full page reload |

### 🟢 Enhancement — تحسينات إضافية

| # | التحسين | أين |
|---|---------|-----|
| 16 | Drag-and-drop sort لأنواع المركبات | `vehicle-types` |
| 17 | Export CSV/Excel للبيانات | Tables |
| 18 | Date Range filter للرحلات والرسائل | Multiple pages |
| 19 | Bulk actions في جداول المستخدمين | `users` |
| 20 | Real-time notifications | Topbar |
| 21 | Chart للـ revenue trend (line chart) | Dashboard |
| 22 | Rating distribution bar chart | Ratings page |
| 23 | Auto-refresh لمواقع السائقين | `driver-locations` |

---

## 6. أوامر التطبيق

### الخطوة 1 — تصحيح نظام الألوان في `globals.css`

```bash
# استبدل محتوى globals.css كاملاً بنظام الألوان الجديد المذكور في القسم 1
# المتغيرات الجديدة:
# --brand-primary: #F59E0B (أصفر تاكسي)
# --sidebar-bg: var(--surface)
# --topbar-bg: var(--surface)
# --shadow-card: متغير ديناميكي
```

### الخطوة 2 — تصحيح `layout.tsx`

```tsx
// src/app/layout.tsx
import { Cairo, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
});

const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`${cairo.variable} ${ibmMono.variable} antialiased`}
            style={{ fontFamily: "var(--font-cairo), 'Cairo', sans-serif" }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### الخطوة 3 — دمج `sidebar.tsx` في `dashboard-shell.tsx`

```tsx
// src/components/dashboard-shell.tsx — الجزء المحدّث

// استبدل الـ Desktop Sidebar القديم بـ:
<aside
  className="hidden lg:flex flex-col fixed inset-y-0 right-0 z-40"
  style={{
    width: "var(--sidebar-width)",
    background: "var(--sidebar-bg)",
    borderLeft: "1px solid var(--sidebar-border)",
    boxShadow: "var(--shadow-lg)",
  }}
>
  {/* Logo */}
  <div className="flex items-center gap-3 px-5 py-5"
       style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
         style={{ background: "var(--brand-primary)", boxShadow: "var(--shadow-brand)" }}>
      <Zap size={18} className="text-white" />
    </div>
    <div>
      <div className="text-sm font-extrabold" style={{ color: "var(--sidebar-text-active)" }}>
        {t("metadata.title")}
      </div>
      <div className="text-[10px] font-medium mt-0.5" style={{ color: "var(--sidebar-text)" }}>
        لوحة تحكم الأدمن
      </div>
    </div>
  </div>

  {/* Nav */}
  <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 hide-scrollbar">
    {navItems.map((item) => (
      <SidebarItem key={item.href} {...item} active={isActive(item.href)} />
    ))}
  </nav>

  {/* Bottom Controls */}
  <div className="p-3" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
    <div className="flex items-center gap-2 mb-2">
      <ThemeToggle />
      <LanguageSwitcher />
    </div>
    <LogoutButton />
  </div>
</aside>
```

### الخطوة 4 — تصحيح `stat-card.tsx`

```tsx
// استبدل
border: `1px solid rgba(255,255,255,0.05)`,
boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",

// بـ
border: "1px solid var(--border-subtle)",
boxShadow: "var(--shadow-card)",
```

### الخطوة 5 — إضافة Toast System

```bash
npm install sonner
```

```tsx
// src/app/layout.tsx — أضف
import { Toaster } from "sonner";

// في الـ body
<Toaster
  position="bottom-left"
  toastOptions={{
    style: {
      background: "var(--surface-1)",
      border: "1px solid var(--border-default)",
      color: "var(--text-body)",
    },
  }}
/>
```

ثم استبدل كل `alert()` بـ:
```tsx
import { toast } from "sonner";

// بدل alert("حدث خطأ")
toast.error("حدث خطأ غير متوقع");

// بدل alert("تم الحفظ")
toast.success("تم الحفظ بنجاح");
```

### الخطوة 6 — إضافة Keyframes المفقودة في `globals.css`

```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-16px); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%       { opacity: 0.8; transform: scale(1.08); }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

@keyframes slide-in-left {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
```

### الخطوة 7 — تحديث `topbar.tsx` لدعم Light Mode

```tsx
// ❌ القديم
style={{ background: "rgba(4, 8, 16, 0.85)" }}

// ✅ الجديد
style={{
  background: "var(--topbar-bg)",
  borderBottom: "1px solid var(--topbar-border)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  boxShadow: "var(--shadow-sm)",
}}
```

### الخطوة 8 — إضافة الـ Breadcrumb Component

```tsx
// src/components/breadcrumb.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const pathLabels: Record<string, string> = {
  dashboard: "لوحة التحكم",
  users: "المستخدمين",
  drivers: "السائقين",
  trips: "الرحلات",
  complaints: "الشكاوي",
  ratings: "التقييمات",
  coupons: "الكوبونات",
  "user-coupons": "كوبونات المستخدمين",
  notifications: "الإشعارات",
  pricing: "التسعير",
  "vehicle-types": "أنواع المركبات",
  messages: "الرسائل",
  "driver-locations": "مواقع السائقين",
  "admin-logs": "سجل الأدمن",
  "trip-offers": "عروض الرحلات",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
      {segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const label = pathLabels[seg] || seg;
        const isLast = i === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronLeft size={12} className="opacity-40" />}
            {isLast ? (
              <span className="font-semibold" style={{ color: "var(--text-body)" }}>{label}</span>
            ) : (
              <Link href={href} className="hover:text-body transition-colors">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
```

### الخطوة 9 — إضافة Map لمواقع السائقين

```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

```tsx
// src/app/dashboard/driver-locations/DriverMap.tsx
"use client";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });
```

### الخطوة 10 — تصحيح `data-table.tsx`

```tsx
// استبدل table header
<thead>
  <tr style={{
    background: "var(--bg-subtle)",
    borderBottom: "1px solid var(--border-default)"
  }}>
    {headers.map((h) => (
      <th
        key={h.key}
        className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
        style={{ color: "var(--text-muted)" }}
      >
        {h.label}
      </th>
    ))}
  </tr>
</thead>
```

---

## ملخص الأولويات

### Phase 1 — إصلاح الأساس (أسبوع 1)
1. ✅ تحديث `globals.css` بالنظام الجديد كاملاً
2. ✅ إضافة Font Cairo في `layout.tsx`
3. ✅ تصحيح خلفية Topbar وSidebar
4. ✅ إضافة الـ Keyframes المفقودة
5. ✅ إصلاح Light Mode في StatCard وCharts

### Phase 2 — تحسين الـ UX (أسبوع 2)
6. ✅ إضافة Toast System (sonner)
7. ✅ إضافة Breadcrumb
8. ✅ تحسين DataTable (header, empty state, pagination)
9. ✅ تحسين Modal (animation, footer, sizes)
10. ✅ دمج Dashboard Shell مع Sidebar

### Phase 3 — Features (أسبوع 3)
11. ✅ إضافة Map لمواقع السائقين
12. ✅ دمج Vehicle Types و Pricing
13. ✅ إضافة Line Chart للـ Revenue Trend
14. ✅ Rating Distribution Chart
15. ✅ Star display في Ratings table

### Phase 4 — Polish (أسبوع 4)
16. ✅ Loading Skeletons لكل صفحة
17. ✅ Export CSV/Excel
18. ✅ Date Range filters
19. ✅ Bulk Actions
20. ✅ Auto-refresh لمواقع السائقين

---

*المستند ده اتعمل بتاريخ أبريل 2026 — يوفر خطة تطوير شاملة للـ Taxi Web Admin Dashboard بناءً على تحليل عميق لكل ملف في الكود.*