# تقرير تدقيق الألوان الكامل — Obsidian Amber Design System

> **الملف المُحلَّل:** `src/app/globals.css`
>
> **النطاق:** كل ملفات `.tsx` و `.ts` داخل `src/`
>
> **تاريخ التحليل:** مايو 2026
>
> **المشروع:** Taxi Admin Dashboard (Next.js + Tailwind CSS)

---

## فهرس المحتويات

1. [ملخص تنفيذي](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#1-%D9%85%D9%84%D8%AE%D8%B5-%D8%AA%D9%86%D9%81%D9%8A%D8%B0%D9%8A)
2. [الأرقام الإجمالية](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#2-%D8%A7%D9%84%D8%A3%D8%B1%D9%82%D8%A7%D9%85-%D8%A7%D9%84%D8%A5%D8%AC%D9%85%D8%A7%D9%84%D9%8A%D8%A9)
3. [ما تم صح — لا يحتاج تدخل](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#3-%D9%85%D8%A7-%D8%AA%D9%85-%D8%B5%D8%AD)
4. [المشاكل الحرجة — HIGH Priority](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#4-%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D9%83%D9%84-%D8%A7%D9%84%D8%AD%D8%B1%D8%AC%D8%A9)
5. [المشاكل المتوسطة — MEDIUM Priority](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#5-%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D9%83%D9%84-%D8%A7%D9%84%D9%85%D8%AA%D9%88%D8%B3%D8%B7%D8%A9)
6. [المشاكل البسيطة — LOW Priority](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#6-%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D9%83%D9%84-%D8%A7%D9%84%D8%A8%D8%B3%D9%8A%D8%B7%D8%A9)
7. [المتغيرات الميتة — Dead Variables](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#7-%D8%A7%D9%84%D9%85%D8%AA%D8%BA%D9%8A%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D9%8A%D8%AA%D8%A9)
8. [تحليل الـ @theme inline](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#8-%D8%AA%D8%AD%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D9%80-theme-inline)
9. [جدول كل المتغيرات في :root](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#9-%D8%AC%D8%AF%D9%88%D9%84-%D9%83%D9%84-%D8%A7%D9%84%D9%85%D8%AA%D8%BA%D9%8A%D8%B1%D8%A7%D8%AA-%D9%81%D9%8A-root)
10. [قائمة الإصلاحات المطلوبة بالترتيب](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#10-%D9%82%D8%A7%D8%A6%D9%85%D8%A9-%D8%A7%D9%84%D8%A5%D8%B5%D9%84%D8%A7%D8%AD%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%B7%D9%84%D9%88%D8%A8%D8%A9-%D8%A8%D8%A7%D9%84%D8%AA%D8%B1%D8%AA%D9%8A%D8%A8)
11. [الكود المقترح للإصلاح](https://claude.ai/chat/38115342-b172-4cd6-96d4-81e9cf86797f#11-%D8%A7%D9%84%D9%83%D9%88%D8%AF-%D8%A7%D9%84%D9%85%D9%82%D8%AA%D8%B1%D8%AD-%D9%84%D9%84%D8%A5%D8%B5%D9%84%D8%A7%D8%AD)

---

## 1. ملخص تنفيذي

التحليل شمل **كل ملف** في المشروع — الـ CSS والـ TSX والـ TS. الخبر الكويس إن فيه انضباط واضح في التعامل مع الألوان:  **لا يوجد أي لون hex مكتوب مباشرة داخل ملفات TSX** ، كل الألوان بتمشي عبر CSS variables. ده مستوى تنظيم كويس.

لكن في داخل ملف `globals.css` نفسه فيه مشاكل حقيقية، أكبرها وأخطرها إن **`--primary` و `--warning` بيشيروا لنفس اللون** (`#F59E0B` الأمبر الذهبي)، وده معناه إن أي `warning badge` وأي `primary button` موجودين جنب بعض على الشاشة هيكونوا بنفس اللون تماماً — وده مشكلة تصميم أساسية مش مجرد تشغيل كود.

فيه برضو  **38 متغير CSS معرَّف بس مش مستخدم في أي مكان** ، ومعظمهم بقايا نظام sidebar قديم اتنقل لنظام `--sb-*` جديد لكن القديم فضل موجود.

---

## 2. الأرقام الإجمالية

| المقياس                                                               | القيمة                              |
| ---------------------------------------------------------------------------- | ----------------------------------------- |
| إجمالي متغيرات CSS محددة في `:root`                    | **120 متغير**                  |
| إجمالي متغيرات CSS في `.dark`                               | **107 متغير**                  |
| متغيرات لها قيمة hex مباشرة في `:root`               | **58 متغير**                   |
| قيم hex مكررة (نفس اللون لأكثر من متغير)         | **13 حالة**                     |
| متغيرات مستخدمة عبر `var()`في TSX/TS                    | **60 متغير**                   |
| متغيرات مستخدمة عبر Tailwind classes                        | **~15 متغير إضافي**       |
| متغيرات معرَّفة ولا تُستخدم مطلقاً في TSX/TS | **38 متغير**                   |
| ألوان hex مكتوبة مباشرة في ملفات TSX                 | **0**✅                             |
| ملفات TSX تستخدم CSS variables                                    | **28 ملف**                       |
| أكثر ملف استخدام للألوان                                | `coupon-analytics/page.tsx`(105 مرة) |

---

## 3. ما تم صح

### ✅ لا يوجد hex مكتوب مباشرة في TSX

التحقق من كل ملفات `.tsx` و `.ts` بحثاً عن أي قيمة `#RRGGBB` مكتوبة مباشرة —  **النتيجة: صفر** . كل الألوان بتمشي عبر CSS variables أو Tailwind classes مربوطة بـ CSS variables. ده يعني لو غيرت قيمة في `globals.css` هيتطبق التغيير تلقائياً في كل مكان.

### ✅ نظام الـ CSS Variables هيكلي ومنظم

المتغيرات مقسمة في sections واضحة:

* `BACKGROUNDS` — خلفيات الصفحة والسطح
* `DIVIDERS` — خطوط الفصل
* `TEXT` — ألوان النص
* `BRAND` — ألوان العلامة التجارية
* `STATUS` — ألوان الحالات (success/warning/error/info)
* `EXTENDED PALETTE` — ألوان إضافية للرسوم البيانية
* `SIDEBAR TOKENS` — متغيرات الـ sidebar

### ✅ Dark Mode مكتمل

كل الألوان الأساسية عندها قيمة مختلفة في `.dark`. مفيش متغير رئيسي بيأخذ نفس القيمة في الـ light والـ dark إلا لما يكون ده مقصود (زي ألوان الـ brand اللي بتفضل ثابتة).

### ✅ الأورنج مش مكرر (سؤالك المحدد)

الأسئلة كانت: هل `--color-orange` مكرر؟ الإجابة:  **لا، ليس مكرراً من ناحية القيمة** . في عندك لونين أمبر/برتقالي:

```
--primary:      #F59E0B  → أمبر ذهبي (Tailwind amber-500)
--color-orange: #F97316  → برتقالي فعلي (Tailwind orange-500)
```

الفرق بينهم `#F59E0B` مقابل `#F97316` — قيمتين مختلفتين تماماً. `--color-orange` مستخدم في:

* `pricing-client.tsx` كخيار لون للـ vehicle types
* اسم payment method فقط (مش كلون)

**المشكلة الحقيقية مش في `--color-orange`** — المشكلة في `--primary` و `--warning` اللي هما نفس القيمة.

### ✅ الـ RGB counterparts موجودة لكل لون أساسي

كل لون أساسي عنده متغير `*-rgb` مقابله للاستخدام في `rgba()`:

```css
--primary: #F59E0B;
--primary-rgb: 245, 158, 11;  /* للاستخدام في rgba(var(--primary-rgb), 0.15) */
```

---

## 4. المشاكل الحرجة

### 🚨 مشكلة 1: `--primary` و `--warning` نفس اللون

**الخطورة: HIGH — مشكلة تصميمية أساسية**

```css
/* :root */
--primary: #F59E0B;   /* علامة تجارية — أمبر ذهبي */
--warning: #F59E0B;   /* تحذير — نفس الأمبر الذهبي ❌ */

/* .dark */
--primary: #F59E0B;   /* نفس */
--warning: #F59E0B;   /* نفس ❌ */
```

**لماذا هذا خطأ تصميمي:**

الـ `--primary` بيعبر عن هوية العلامة التجارية للتطبيق (الـ brand color). الـ `--warning` بيعبر عن حالة تحذير (مثلاً: "هذا السائق لم يتم التحقق منه بعد"). لما الاتنين نفس اللون، المستخدم مش قادر يفرق بين الـ primary actions والـ warning states بصرياً.

**مثال عملي من الكود:**

في `charts.tsx`:

```tsx
accepted: "var(--primary)",      // لون الرحلات المقبولة في الرسم البياني
searching: "var(--warning)",      // حالة السائق بيدور على رحلة
```

في الرسم البياني، الاتنين هيظهروا بنفس اللون الأمبر — مستحيل تفرق بينهم.

في `badge.tsx`:

```tsx
// primary badge ← أمبر
// warning badge ← نفس الأمبر ❌
```

**حجم الاستخدام:**

* `--primary` مستخدم **102+ مرة** في 28 ملف
* `--warning` مستخدم **32 مرة** في 15 ملف

**الحل المقترح:**

غيّر `--warning` لقيمة مختلفة بصرياً. الخيارات:

| خيار                  | القيمة | الوصف                                                                  |
| ------------------------- | ------------ | --------------------------------------------------------------------------- |
| خيار 1 (الأفضل) | `#F97316`  | أورنج (Tailwind orange-500) — أغمق من الأمبر ويتميز |
| خيار 2                | `#EAB308`  | أصفر (Tailwind yellow-500) — مختلف جداً                       |
| خيار 3                | `#FB923C`  | أورنج فاتح (Tailwind orange-400)                                   |

**ملاحظة مهمة:** لو غيرت `--warning`، لازم تغيّر برضو:

* `--warning-rgb`
* `--warning-light`
* `--warning-surface`
* `--warning-border`

---

### 🚨 مشكلة 2: `--text-muted` = `--text-tertiary` (متغير ميت مكرر)

**الخطورة: HIGH — متغير عديم الفائدة**

```css
/* :root */
--text-tertiary: #64748B;   /* مستخدم 22+ مرة ✅ */
--text-muted:    #64748B;   /* مستخدم 0 مرة ❌ — نفس القيمة */

/* .dark */
--text-tertiary: #64748B;
--text-muted:    #64748B;   /* حتى في الـ dark mode نفس القيمة */
```

`--text-muted` مش مستخدم في **أي ملف** في المشروع، ولا حتى في `globals.css` نفسه. وهو أصلاً نفس قيمة `--text-tertiary`. ده متغير ميت بيأخذ مساحة وبيخلي أي developer جديد يتساءل "إيه الفرق بين text-muted وtext-tertiary؟".

**الحل:** احذف `--text-muted` بالكامل من `:root` ومن `.dark`.

---

### 🚨 مشكلة 3: `--warning-light` = `--primary-light` (ومش مستخدم)

**الخطورة: HIGH**

```css
--primary-light: #FCD34D;   /* مستخدم 5 مرات ✅ */
--warning-light: #FCD34D;   /* مستخدم 0 مرات ❌ — نفس القيمة */
```

`--warning-light` لم يُستخدم في أي مكان. وهو نفس `--primary-light` — منطقي لأن `--warning` نفسه = `--primary`.

**الحل:** احذف `--warning-light`. (لما تصلح مشكلة 1 وتغيّر `--warning` لقيمة مختلفة، هتضطر تحدد `--warning-light` بقيمة مناسبة لها.)

---

## 5. المشاكل المتوسطة

### ⚠️ مشكلة 4: `--sb-logout-text` = `--error`

```css
--error:          #EF4444;   /* مستخدم كثيراً ✅ */
--sb-logout-text: #EF4444;   /* في globals.css بس ما يُستخدمش في TSX ❌ */
```

في الـ sidebar classes في `globals.css`، بيستخدم `--sb-logout-text` للـ logout button. لكن المشكلة إن القيمة هي بالظبط نفس `--error`. الأصح إن `--sb-logout-text` يكون `var(--error)` مش قيمة hex منسوخة.

**في `.dark`:**

```css
--error:          #EF4444;   /* نفس القيمة */
--sb-logout-text: #EF4444;   /* نفس القيمة */
```

**الحل:** في `globals.css` نفسه، غيّر:

```css
--sb-logout-text: var(--error);   /* بدل #EF4444 */
```

وبكده لو غيرت `--error` في أي وقت، الـ logout button هيتغير تلقائياً.

---

### ⚠️ مشكلة 5: 4 متغيرات لنفس قيمة `#F8FAFC`

```css
--background:     #F8FAFC;   /* مستخدم 15+ مرة ✅ */
--surface-muted:  #F8FAFC;   /* مستخدم 8+ مرة ✅ */
--table-head-bg:  #F8FAFC;   /* بيستخدمه globals.css بس ✅/⚠️ */
--sb-tooltip-text:#F8FAFC;   /* بيستخدمه globals.css بس ✅/⚠️ */
```

في الـ dark mode، الأربعة مختلفين:

```css
--background:     #080A0F   /* أسود عميق */
--surface-muted:  #12151C   /* رمادي داكن */
--table-head-bg:  #1A1E28   /* رمادي داكن أفتح */
--sb-tooltip-text:#F8FAFC   /* فاتح (للنص على خلفية داكنة) */
```

لاحظ إن `--sb-tooltip-text` في الـ dark mode = `#F8FAFC` وده **صح** ومقصود لأنه نص أبيض على tooltip داكن. لكن في الـ light mode كونه = `--background` ده مجرد تقاطع، مش علاقة semantic.

**الحل:** `--table-head-bg` ممكن يصبح `var(--surface-muted)` بدل قيمة hex.

---

### ⚠️ مشكلة 6: `--surface` و `--surface-high` كلاهما `#FFFFFF` في light mode

```css
--surface:      #FFFFFF;   /* مستخدم كثيراً ✅ */
--surface-high: #FFFFFF;   /* مستخدم ✅ */
```

في الـ light mode الاتنين أبيض خالص. لكن في الـ dark mode بيختلفوا:

```css
--surface:      #12151C   /* داكن */
--surface-high: #212631   /* أفتح قليلاً — "سطح مرفوع" */
```

ده منطقي في الـ dark mode — `--surface-high` بيمثل عناصر أعلى في الـ z-stack بتاعة التصميم (كارد فوق كارد). لكن في الـ light mode مش بيتميز. ده مقبول لأن في الـ light mode مش محتاج تفريق في اللون بين مستويات السطح.

**الحل:** مفيش إجراء ضروري هنا — ده تصميمي مقصود.

---

### ⚠️ مشكلة 7: 3 متغيرات لـ `#F1F5F9` واتنين منهم ما يُستخدمش في TSX

```css
--bg-secondary:       #F1F5F9;   /* مستخدم في globals.css بس، مش في TSX ⚠️ */
--surface-elevated:   #F1F5F9;   /* مستخدم كثيراً في TSX ✅ */
--chrome-control-bg:  #F1F5F9;   /* مستخدم في globals.css بس ⚠️ */
```

في الـ dark mode الثلاثة مختلفين:

```css
--bg-secondary:      #080A0F    /* أسود عميق */
--surface-elevated:  #1A1E28    /* رمادي داكن */
--chrome-control-bg: #1E232E    /* رمادي داكن أفتح */
```

`--bg-secondary` اسمه مبهم ومتداخل مع `--surface-elevated`. `--chrome-control-bg` مستخدم في CSS classes بس مش في TSX مباشرة.

**الحل:** `--bg-secondary` ممكن يتحذف أو يُوضح استخدامه. قيمته في الـ dark mode مختلفة عن `--surface-elevated` يعني مش تكرار كامل.

---

### ⚠️ مشكلة 8: 4 متغيرات لـ `#E2E8F0` و3 منهم ما يُستخدمش في TSX

```css
--divider:               #E2E8F0;   /* الأصل — مستخدم كثيراً ✅ */
--topbar-border:         #E2E8F0;   /* مستخدم في globals.css CSS classes بس ⚠️ */
--chrome-control-border: #E2E8F0;   /* مستخدم في globals.css CSS classes بس ⚠️ */
--chrome-join-line:      #E2E8F0;   /* مستخدم في globals.css CSS classes + sidebar-chrome-shadow ⚠️ */
```

في الـ dark mode:

```css
--divider:               #282E3A
--topbar-border:         #282E3A   /* نفس --divider */
--chrome-control-border: #3B4354   /* مختلف */
--chrome-join-line:      #282E3A   /* نفس --divider */
```

`--topbar-border` و `--chrome-join-line` هما نفس `--divider` في الـ light والـ dark. يعني ممكن يتحولوا لـ `var(--divider)` بدون تأثير على الشكل.

**الحل:**

```css
/* بدل */
--topbar-border: #E2E8F0;
/* يبقى */
--topbar-border: var(--divider);
```

---

### ⚠️ مشكلة 9: `--primary-dark`, `--sidebar-icon-active`, `--sb-mobile-btn-text` = `#D97706`

```css
--primary-dark:       #D97706;   /* مستخدم كثيراً ✅ */
--sidebar-icon-active:#D97706;   /* متغير قديم، مش مستخدم في TSX ❌ */
--sb-mobile-btn-text: #D97706;   /* مستخدم في globals.css CSS class ⚠️ */
```

في الـ dark mode:

```css
--primary-dark:       #D97706   /* نفس */
--sidebar-icon-active: —        /* مش موجود في .dark */
--sb-mobile-btn-text: #F59E0B   /* يتغير للـ primary في الـ dark mode */
```

`--sidebar-icon-active` متغير قديم من نظام sidebar سابق وما عندهوش تعريف في `.dark`. `--sb-mobile-btn-text` مستخدم في CSS class بس وقيمته مختلفة في الـ dark mode فيستحق يفضل.

**الحل:** احذف `--sidebar-icon-active`. غيّر تعريف `--sb-mobile-btn-text` ليكون `var(--primary-dark)` في الـ light mode بدل تكرار القيمة.

---

### ⚠️ مشكلة 10: 5 متغيرات لـ `#94A3B8`

```css
--text-disabled:    #94A3B8;   /* مستخدم كثيراً ✅ */
--sb-group-label:   #94A3B8;   /* مستخدم في globals.css ✅ */
--sb-footer-text:   #94A3B8;   /* مستخدم في TSX + globals.css ✅ */
--sb-brand-sub:     #94A3B8;   /* مستخدم في globals.css ✅ */
--sb-version-text:  #94A3B8;   /* مستخدم في globals.css ✅ */
```

في الـ dark mode الخمسة مختلفين:

```css
--text-disabled:    #475569
--sb-group-label:   #64748B
--sb-footer-text:   #94A3B8    /* نفس الـ light */
--sb-brand-sub:     #94A3B8    /* نفس الـ light */
--sb-version-text:  #475569
```

الـ sidebar tokens (`--sb-*`) بيتحكموا في أشياء مختلفة في الـ dark mode — يعني التشابه في الـ light mode صدفة مش علاقة semantic. ده مقبول من منظور تصميمي. الـ 5 متغيرات كلهم مستخدمين وكلهم عندهم دور مختلف.

**الحل:** مفيش إجراء ضروري هنا.

---

### ⚠️ مشكلة 11: 4 متغيرات لـ `#1E293B`

```css
--sidebar-text-active: #1E293B;   /* متغير قديم — مش مستخدم في TSX ❌ */
--sb-nav-text-active:  #1E293B;   /* مستخدم في globals.css CSS classes ✅ */
--sb-footer-hover:     #1E293B;   /* مستخدم في globals.css CSS classes ✅ */
--sb-tooltip-bg:       #1E293B;   /* مستخدم في globals.css CSS classes ✅ */
```

في الـ dark mode:

```css
--sidebar-text-active: —           /* مش موجود في .dark */
--sb-nav-text-active:  #F8FAFC    /* أبيض */
--sb-footer-hover:     #F8FAFC    /* أبيض */
--sb-tooltip-bg:       #1E232E    /* داكن جداً */
```

`--sidebar-text-active` متغير قديم بدون تعريف في `.dark` — ده علامة إنه من نظام قديم.

**الحل:** احذف `--sidebar-text-active`.

---

## 6. المشاكل البسيطة

### 📋 مشكلة 12: `--divider-strong` = `--sb-group-dot` في light mode

```css
--divider-strong: #CBD5E1;   /* مستخدم ✅ */
--sb-group-dot:   #CBD5E1;   /* مستخدم في globals.css ✅ */
```

في الـ dark mode مختلفين:

```css
--divider-strong: #3B4354
--sb-group-dot:   rgba(255, 255, 255, 0.15)   /* مختلف تماماً */
```

التشابه في الـ light mode صدفة. كل متغير بيقوم بدور مختلف وعنده قيمة مختلفة في الـ dark mode. مقبول.

---

### 📋 مشكلة 13: `--sidebar-border` = `--sb-border` = `--sb-group-line` = `--sb-mobile-btn-border`

```css
--sidebar-border:      #E2E5EC;   /* متغير قديم — مش مستخدم ❌ */
--sb-border:           #E2E5EC;   /* مستخدم في globals.css ✅ */
--sb-group-line:       #E2E5EC;   /* مستخدم في globals.css ✅ */
--sb-mobile-btn-border:#E2E5EC;   /* مستخدم في globals.css ✅ */
```

في الـ dark mode:

```css
--sidebar-border:       —                          /* مش موجود */
--sb-border:            #282E3A
--sb-group-line:        rgba(255, 255, 255, 0.05)  /* مختلف */
--sb-mobile-btn-border: #282E3A
```

`--sidebar-border` متغير قديم ومش موجود في `.dark`. احذفه.

الباقي (`--sb-border`, `--sb-group-line`, `--sb-mobile-btn-border`) مختلفين في الـ dark mode فهم ليسوا تكراراً حقيقياً.

---

## 7. المتغيرات الميتة

دي المتغيرات اللي بيتم تعريفها في `:root` أو `.dark` لكن **لا تُستخدم في أي ملف TSX/TS** ولا حتى في `globals.css` نفسه.

### متغيرات قديمة (Legacy Sidebar System)

دول بقايا نظام sidebar قديم قبل ما يتنقل للـ `--sb-*` tokens:

```css
/* كلهم في :root بس، مفيش تعريف في .dark */
--sidebar-bg:          #F6F7FA    /* ✗ مش مستخدم نهائياً */
--sidebar-border:      #E2E5EC    /* ✗ مش مستخدم نهائياً */
--sidebar-icon-active: #D97706    /* ✗ مش مستخدم نهائياً */
--sidebar-item-active: #FFF8EB    /* ✗ مش مستخدم نهائياً */
--sidebar-item-hover:  #EBEEF5    /* ✗ مش مستخدم نهائياً */
--sidebar-text:        #64748B    /* ✗ مش مستخدم نهائياً */
--sidebar-text-active: #1E293B    /* ✗ مش مستخدم نهائياً */
```

**الإجراء:** احذف كل السطور دي من `:root`. مش محتاجين تعريف في `.dark` أصلاً لأنهم مش مستخدمين.

### متغيرات لها تعريف لكن لا تُستخدم

```css
--text-muted:             #64748B    /* ✗ نفس --text-tertiary ومش مستخدم */
--warning-light:          #FCD34D    /* ✗ نفس --primary-light ومش مستخدم */
--primary-surface-strong: rgba(245, 158, 11, 0.18)   /* ✗ مش مستخدم في TSX */
--sb-logo-glow:           none       /* ✗ قيمة none ومش مستخدم */
```

### متغيرات radius غير مستخدمة

```css
--radius-sm:  8px    /* ✗ مش مستخدم — المستخدم هو --radius-md */
--radius-xl:  20px   /* ✗ مش مستخدم */
--radius-2xl: 24px   /* ✗ مش مستخدم */
```

ملاحظة: `--radius-md: 12px` و `--radius-lg: 16px` مستخدمين بس `--radius-sm` و `--radius-xl` و `--radius-2xl` مش مستخدمين.

### `--shadow-xl` غير مستخدم

```css
--shadow-xl: 0 16px 48px rgba(0,0,0,0.10), 0 24px 64px rgba(0,0,0,0.07);   /* ✗ */
```

المستخدم فعلياً هو `--shadow-sm`, `--shadow-md`, `--shadow-lg`.

---

## 8. تحليل الـ @theme inline

الـ `@theme inline` بيحول CSS variables لـ Tailwind utility classes. دي قائمة كل المتغيرات المعرَّفة هناك:

```css
@theme inline {
  /* Backgrounds */
  --color-background: var(--background);        /* → bg-background */
  --color-surface: var(--surface);              /* → bg-surface */
  --color-surface-elevated: var(--surface-elevated); /* → bg-surface-elevated */
  --color-surface-high: var(--surface-high);    /* → bg-surface-high */
  --color-surface-muted: var(--surface-muted);  /* → bg-surface-muted */
  --color-foreground: var(--text-primary);      /* → text-foreground */
  --color-divider: var(--divider);              /* → border-divider, bg-divider */
  
  /* Brand */
  --color-primary: var(--primary);             /* → bg-primary, text-primary, border-primary */
  --color-primary-dark: var(--primary-dark);   /* → text-primary-dark */
  --color-primary-light: var(--primary-light); /* → bg-primary-light */
  --color-primary-surface: var(--primary-surface); /* → bg-primary-surface */
  --color-primary-text: var(--primary-text);   /* → text-primary-text */
  
  /* Text */
  --color-text-primary: var(--text-primary);   /* → text-text-primary */
  --color-text-secondary: var(--text-secondary); /* → text-text-secondary */
  --color-text-tertiary: var(--text-tertiary); /* → text-text-tertiary */
  --color-text-disabled: var(--text-disabled); /* → text-text-disabled */
  
  /* Status */
  --color-success: var(--success);             /* → text-success, bg-success */
  --color-success-light: var(--success-light); /* → text-success-light */
  --color-warning: var(--warning);             /* → text-warning, bg-warning */
  --color-warning-light: var(--warning-light); /* → bg-warning-light ← غير مستخدم */
  --color-error: var(--error);                 /* → text-error, bg-error */
  --color-error-light: var(--error-light);     /* → text-error-light ← نادر الاستخدام */
  --color-info: var(--info);                   /* → text-info, bg-info */
  
  /* Extended Palette */
  --color-purple: var(--color-purple);         /* → text-purple */
  --color-pink: var(--color-pink);             /* → text-pink */
  --color-cyan: var(--color-cyan);             /* → text-cyan */
  --color-orange: var(--color-orange);         /* → text-orange ← نادر الاستخدام */
  --color-white: var(--color-white);           /* → text-white, bg-white */
  --color-black: var(--color-black);           /* → text-black, bg-black */
  
  --color-accent-purple: var(--color-purple);  /* ← مكرر! نفس --color-purple */
}
```

### مشكلة في @theme: `--color-accent-purple` = `--color-purple`

```css
--color-purple: var(--color-purple);           /* → class: text-purple */
--color-accent-purple: var(--color-purple);    /* → class: text-accent-purple ← نفس اللون */
```

`--color-accent-purple` بيشير لنفس `--color-purple`. لا يُستخدم في أي TSX/TS ملف. احذفه.

---

## 9. جدول كل المتغيرات في :root

### البالستة (Backgrounds)

| المتغير         | Light Mode                 | Dark Mode               | مستخدم في TSX؟ | ملاحظة                            |
| ---------------------- | -------------------------- | ----------------------- | ----------------------- | --------------------------------------- |
| `--background`       | `#F8FAFC`                | `#080A0F`             | ✅ نعم               |                                         |
| `--bg-secondary`     | `#F1F5F9`                | `#080A0F`             | ⚠️ CSS فقط         | نفس `--surface-elevated`في light |
| `--surface`          | `#FFFFFF`                | `#12151C`             | ✅ نعم               |                                         |
| `--surface-high`     | `#FFFFFF`                | `#212631`             | ✅ نعم               | نفس `--surface`في light          |
| `--surface-elevated` | `#F1F5F9`                | `#1A1E28`             | ✅ نعم               |                                         |
| `--surface-muted`    | `#F8FAFC`                | `#12151C`             | ✅ نعم               | نفس `--background`في light       |
| `--surface-glass`    | `rgba(255,255,255,0.88)` | `rgba(18,21,28,0.88)` | ✅ نعم               |                                         |

### خطوط الفصل (Dividers)

| المتغير              | Light Mode         | Dark Mode                  | مستخدم في TSX؟ | ملاحظة         |
| --------------------------- | ------------------ | -------------------------- | ----------------------- | -------------------- |
| `--divider`               | `#E2E8F0`        | `#282E3A`                | ✅ نعم               | الأصل           |
| `--divider-strong`        | `#CBD5E1`        | `#3B4354`                | ✅ نعم               |                      |
| `--table-row-border`      | `var(--divider)` | `rgba(255,255,255,0.08)` | ⚠️ CSS فقط         |                      |
| `--topbar-border`         | `#E2E8F0`        | `#282E3A`                | ❌ لا                 | =`--divider`       |
| `--chrome-control-border` | `#E2E8F0`        | `#3B4354`                | ❌ لا                 | dark ≠`--divider` |
| `--chrome-join-line`      | `#E2E8F0`        | `#282E3A`                | ❌ لا                 | =`--divider`       |

### النصوص (Text)

| المتغير       | Light Mode  | Dark Mode   | مستخدم في TSX؟      | ملاحظة         |
| -------------------- | ----------- | ----------- | ---------------------------- | -------------------- |
| `--text-primary`   | `#0F172A` | `#F8FAFC` | ✅ نعم                    |                      |
| `--text-secondary` | `#475569` | `#94A3B8` | ✅ نعم                    |                      |
| `--text-tertiary`  | `#64748B` | `#64748B` | ✅ نعم                    |                      |
| `--text-disabled`  | `#94A3B8` | `#475569` | ✅ نعم                    |                      |
| `--text-muted`     | `#64748B` | `#64748B` | ❌**لا — احذف** | =`--text-tertiary` |

### العلامة التجارية (Brand)

| المتغير               | Light Mode                | Dark Mode                 | مستخدم في TSX؟      | ملاحظة |
| ---------------------------- | ------------------------- | ------------------------- | ---------------------------- | ------------ |
| `--primary`                | `#F59E0B`               | `#F59E0B`               | ✅ 102+ مرة               |              |
| `--primary-rgb`            | `245, 158, 11`          | `245, 158, 11`          | ✅ نعم                    |              |
| `--primary-dark`           | `#D97706`               | `#D97706`               | ✅ نعم                    |              |
| `--primary-light`          | `#FCD34D`               | `#FCD34D`               | ✅ نعم                    |              |
| `--primary-text`           | `#B45309`               | `#F59E0B`               | ✅ نعم                    |              |
| `--primary-surface`        | `rgba(245,158,11,0.10)` | `rgba(245,158,11,0.15)` | ✅ نعم                    |              |
| `--primary-surface-strong` | `rgba(245,158,11,0.18)` | `rgba(245,158,11,0.25)` | ❌**لا — احذف** |              |

### الحالات (Status)

| المتغير        | Light Mode                             | Dark Mode                 | مستخدم في TSX؟      | ملاحظة                       |
| --------------------- | -------------------------------------- | ------------------------- | ---------------------------- | ---------------------------------- |
| `--success`         | `#10B981`                            | `#10B981`               | ✅ نعم                    |                                    |
| `--success-rgb`     | `16, 185, 129`                       | same                      | ✅ نعم                    |                                    |
| `--success-light`   | `#34D399`                            | `#34D399`               | ✅ نعم                    |                                    |
| `--success-surface` | `rgba(16,185,129,0.10)`              | `rgba(16,185,129,0.15)` | ✅ نعم                    |                                    |
| `--success-border`  | `rgba(16,185,129,0.25)`              | `rgba(16,185,129,0.35)` | ✅ نعم                    |                                    |
| `--warning`         | **`#F59E0B`← نفس primary** | `#F59E0B`               | ✅ 32 مرة                 | **🚨 يجب التغيير** |
| `--warning-rgb`     | `245, 158, 11`                       | same                      | ✅ نعم                    | نفس primary-rgb                 |
| `--warning-light`   | `#FCD34D`                            | `#FCD34D`               | ❌**لا — احذف** |                                    |
| `--warning-surface` | `rgba(245,158,11,0.10)`              | `rgba(245,158,11,0.15)` | ✅ نعم                    |                                    |
| `--warning-border`  | `rgba(245,158,11,0.25)`              | `rgba(245,158,11,0.35)` | ✅ نعم                    |                                    |
| `--error`           | `#EF4444`                            | `#EF4444`               | ✅ نعم                    |                                    |
| `--error-rgb`       | `239, 68, 68`                        | same                      | ✅ نعم                    |                                    |
| `--error-light`     | `#F87171`                            | `#F87171`               | ✅ نعم                    |                                    |
| `--error-surface`   | `rgba(239,68,68,0.09)`               | `rgba(239,68,68,0.15)`  | ✅ نعم                    |                                    |
| `--error-border`    | `rgba(239,68,68,0.25)`               | `rgba(239,68,68,0.35)`  | ✅ نعم                    |                                    |
| `--info`            | `#3B82F6`                            | `#3B82F6`               | ✅ نعم                    |                                    |
| `--info-rgb`        | `59, 130, 246`                       | same                      | ✅ نعم                    |                                    |
| `--info-surface`    | `rgba(59,130,246,0.09)`              | `rgba(59,130,246,0.15)` | ✅ نعم                    |                                    |

### الألوان الإضافية (Extended Palette)

| المتغير         | Light = Dark      | مستخدم في TSX؟ | ملاحظة                   |
| ---------------------- | ----------------- | ----------------------- | ------------------------------ |
| `--color-purple`     | `#8B5CF6`       | ✅ نعم               | في charts وbadges           |
| `--color-purple-rgb` | `139, 92, 246`  | ✅ نعم               |                                |
| `--color-pink`       | `#EC4899`       | ✅ نعم               | في charts وbadges           |
| `--color-pink-rgb`   | `236, 72, 153`  | ✅ نعم               |                                |
| `--color-cyan`       | `#06B6D4`       | ✅ نعم               | في charts وdriver-locations |
| `--color-cyan-rgb`   | `6, 182, 212`   | ✅ نعم               |                                |
| `--color-orange`     | `#F97316`       | ⚠️ نادر           | pricing فقط                 |
| `--color-orange-rgb` | `249, 115, 22`  | ⚠️ نادر           |                                |
| `--color-white`      | `#FFFFFF`       | ✅ نعم               |                                |
| `--color-white-rgb`  | `255, 255, 255` | ✅ نعم               |                                |
| `--color-black`      | `#000000`       | ✅ نعم               |                                |
| `--color-black-rgb`  | `0, 0, 0`       | ✅ نعم               |                                |

### الـ Radius والـ Shadows

| المتغير   | القيمة                        | مستخدم؟               | ملاحظة |
| ---------------- | ----------------------------------- | ---------------------------- | ------------ |
| `--radius-sm`  | `8px`                             | ❌**لا — احذف** |              |
| `--radius-md`  | `12px`                            | ✅ نعم                    |              |
| `--radius-lg`  | `16px`                            | ✅ نعم                    |              |
| `--radius-xl`  | `20px`                            | ❌**لا — احذف** |              |
| `--radius-2xl` | `24px`                            | ❌**لا — احذف** |              |
| `--shadow-sm`  | `0 1px 4px rgba(0,0,0,0.04)...`   | ✅ نعم                    |              |
| `--shadow-md`  | `0 4px 16px rgba(0,0,0,0.06)...`  | ✅ نعم                    |              |
| `--shadow-lg`  | `0 8px 28px rgba(0,0,0,0.08)...`  | ✅ نعم                    |              |
| `--shadow-xl`  | `0 16px 48px rgba(0,0,0,0.10)...` | ❌**لا — احذف** |              |

---

## 10. قائمة الإصلاحات المطلوبة بالترتيب

### 🚨 أولاً: الإصلاحات الجوهرية (Critical)

1. **غيّر `--warning` لقيمة مختلفة عن `--primary`**

   القيمة المقترحة: `#F97316` (orange-500) أو `#EAB308` (yellow-500)

   يستلزم: تحديث `--warning-rgb` + `--warning-light` + `--warning-surface` + `--warning-border`
2. **احذف `--text-muted`** (نسخة ميتة من `--text-tertiary`)
3. **احذف `--warning-light`** (مش مستخدم وسيتحدد تلقائياً بعد تغيير `--warning`)

### ⚠️ ثانياً: إصلاحات نظام Sidebar القديم (تنظيف)

4. احذف كل المتغيرات دي من `:root` (ومن `.dark` لو موجودين هناك):
   ```
   --sidebar-bg--sidebar-border--sidebar-icon-active--sidebar-item-active--sidebar-item-hover--sidebar-text--sidebar-text-active
   ```

### 📋 ثالثاً: تحسينات التنظيم (Housekeeping)

5. **احذف `--primary-surface-strong`** (مش مستخدم في TSX — بس موجود في globals.css)
6. **احذف `--shadow-xl`** (مش مستخدم)
7. **احذف `--radius-sm`، `--radius-xl`، `--radius-2xl`** (مش مستخدمين)
8. **احذف `--sb-logout-text`** أو حوّله لـ `var(--error)` بدل تكرار القيمة
9. **غيّر `--topbar-border` و `--chrome-join-line`** ليكونوا `var(--divider)` بدل تكرار `#E2E8F0`
10. **احذف `--color-accent-purple`** من `@theme inline` (تكرار لـ `--color-purple`)
11. **احذف `--sb-logo-glow`** (قيمته `none` وما بيتغيرش في الـ dark)
12. **احذف `--warning-light`** من `@theme inline`

---

## 11. الكود المقترح للإصلاح

### الإصلاح الأساسي — تغيير `--warning`

**في `:root`:**

```css
/* ← احذف السطور دي */
--warning: #F59E0B;
--warning-rgb: 245, 158, 11;
--warning-light: #FCD34D;
--warning-surface: rgba(245, 158, 11, 0.10);
--warning-border: rgba(245, 158, 11, 0.25);

/* ← وضع السطور دي بدلهم */
--warning: #F97316;
--warning-rgb: 249, 115, 22;
--warning-light: #FB923C;
--warning-surface: rgba(249, 115, 22, 0.10);
--warning-border: rgba(249, 115, 22, 0.25);
```

**في `.dark`:**

```css
/* ← احذف */
--warning: #F59E0B;
--warning-rgb: 245, 158, 11;
--warning-light: #FCD34D;
--warning-surface: rgba(245, 158, 11, 0.15);
--warning-border: rgba(245, 158, 11, 0.35);

/* ← ضع بدلهم */
--warning: #F97316;
--warning-rgb: 249, 115, 22;
--warning-light: #FB923C;
--warning-surface: rgba(249, 115, 22, 0.15);
--warning-border: rgba(249, 115, 22, 0.35);
```

### حذف المتغيرات الميتة

```css
/* ← احذف كل السطور دي من :root */
--text-muted: #64748B;
--warning-light: #FCD34D;                  /* بعد ما تعمل الإصلاح الأساسي */
--primary-surface-strong: rgba(245, 158, 11, 0.18);
--primary-border: rgba(245, 158, 11, 0.40);  /* موجود في .dark بس */
--bg-secondary: #F1F5F9;
--table-head-bg: #F8FAFC;
--sidebar-bg: #F6F7FA;
--sidebar-border: #E2E5EC;
--sidebar-icon-active: #D97706;
--sidebar-item-active: #FFF8EB;
--sidebar-item-hover: #EBEEF5;
--sidebar-text: #64748B;
--sidebar-text-active: #1E293B;
--chrome-control-bg: #F1F5F9;
--topbar-border: #E2E8F0;          /* ← حوّله لـ var(--divider) لو محتاج */
--chrome-join-line: #E2E8F0;       /* ← حوّله لـ var(--divider) لو محتاج */
--sb-logout-text: #EF4444;         /* ← حوّله لـ var(--error) لو محتاج */
--sb-logo-glow: none;
--radius-sm: 8px;
--radius-xl: 20px;
--radius-2xl: 24px;
--shadow-xl: 0 16px 48px rgba(0,0,0,0.10), 0 24px 64px rgba(0,0,0,0.07);
```

### تنظيف @theme inline

```css
/* ← احذف من @theme inline */
--color-warning-light: var(--warning-light);
--color-accent-purple: var(--color-purple);
```

---

## ملاحظات ختامية

**التأثير المتوقع للإصلاحات:**

* حذف المتغيرات الميتة لن يؤثر على شكل الموقع بالمرة — هي أصلاً مش بتُستخدم.
* تغيير `--warning` هو التغيير الوحيد اللي هيأثر على شكل الموقع بشكل مرئي واضح — warning badges وwarning statuses هتاخد لون مختلف. ده تغيير مقصود ومطلوب.
* بعد تغيير `--warning`، لازم تراجع أي مكان بيستخدم `bg-warning` أو `text-warning` أو `border-warning` أو `var(--warning)` في الـ TSX عشان تتأكد إن الشكل الجديد صح.

**الأهمية التصميمية:**

نظام الـ warning/primary المتطابق ده بيخلق `semantic confusion` — يعني المستخدم والـ developer مش قادرين يفرقوا بين "ده action رئيسي" و"ده تحذير". أهم إصلاح في القائمة بالكامل هو تمييز `--warning` عن `--primary`.
