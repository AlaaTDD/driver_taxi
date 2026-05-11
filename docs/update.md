# 🔍 تحليل شامل: الداتابيز vs لوحة تحكم Admin (taxi_web)

## 📊 ملخص تنفيذي

| البند                                                   | العدد                                        |
| ------------------------------------------------------------ | ------------------------------------------------- |
| جداول الداتابيز (بدون `spatial_ref_sys`) | **20 جدول**                             |
| Views الأدمن                                           | **13 view**                                 |
| صفحات الداشبورد الموجودة               | **17 صفحة** (+ 4 صفحات فرعية) |
| API Routes الموجودة                                  | **23 route**                                |
| ✅ جداول**تم تغطيتها**                   | **20 جدول**                             |
| ⚠️ صفحات تحتاج تحسين                        | **3 صفحات**                            |

---

## 🗃️ خريطة تغطية الجداول

| #  | جدول الداتابيز       | صفحة داشبورد                                 | API Routes                                                        | الحالة                              |
| -- | --------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| 1  | `users`                         | ✅`/dashboard/users`                                  | ✅`block`, `set-role`                                         | ✅ مكتمل                             |
| 2  | `drivers_profile`               | ✅`/dashboard/drivers` + `[id]` + `revision`      | ✅`verify`, `revoke`, `toggle-active`, `request-revision` | ✅ مكتمل                             |
| 3  | `trips`                         | ✅`/dashboard/trips` + `[id]`                       | ✅`cancel`, `delete`                                          | ✅ مكتمل                             |
| 4  | `trip_offers`                   | ✅`/dashboard/trip-offers`                            | ❌ لا يوجد                                                  | ⚠️ ناقص API                         |
| 5  | `ratings`                       | ✅`/dashboard/ratings`                                | ✅`delete`                                                      | ✅ مكتمل                             |
| 6  | `complaints`                    | ✅`/dashboard/complaints` + `[id]`                  | ✅`resolve`                                                     | ✅ مكتمل                             |
| 7  | `coupons`                       | ✅`/dashboard/coupons`                                | ✅`delete`, `toggle`                                          | ✅ مكتمل                             |
| 8  | `user_coupons`                  | ✅`/dashboard/user-coupons`                           | ✅`assign`, `delete`                                          | ✅ مكتمل                             |
| 9  | `coupon_usages`                 | ✅ (مدمج في user-coupons)                         | —                                                                | ✅ مكتمل                             |
| 10 | `notifications`                 | ✅`/dashboard/notifications`                          | ✅`send`                                                        | ✅ مكتمل                             |
| 11 | `messages`                      | ⚠️`/dashboard/messages` (support فقط)            | ❌ لا يوجد                                                  | ⚠️ ناقص (رسائل الرحلات) |
| 12 | `support_messages`              | ✅ (مدمج في messages)                             | —                                                                | ✅ مكتمل                             |
| 13 | `vehicle_types`                 | ✅`/dashboard/vehicle-types`                          | ✅`create`, `update`, `delete`, `toggle`                  | ✅ مكتمل                             |
| 14 | `pricing_config`                | ✅`/dashboard/pricing` (بيستخدم vehicle_types) | —                                                                | ✅ مكتمل                             |
| 15 | `driver_locations`              | ✅`/dashboard/driver-locations`                       | —                                                                | ✅ مكتمل                             |
| 16 | `user_presence`                 | ✅ (مدمج في driver-locations)                     | —                                                                | ✅ مكتمل                             |
| 17 | `admin_logs`                    | ✅`/dashboard/admin-logs`                             | —                                                                | ✅ مكتمل                             |
| 18 | `driver_revision_requests`      | ✅ (مدمج في drivers)                              | —                                                                | ✅ مكتمل                             |
| 19 | **`driver_wallets`**      | ✅`/dashboard/wallets`                                | ✅`adjust`                                                      | ✅**تم إنشاؤه**             |
| 20 | **`user_wallets`**        | ✅`/dashboard/wallets`                                | ✅`adjust`                                                      | ✅**تم إنشاؤه**             |
| 21 | **`wallet_transactions`** | ✅`/dashboard/wallets?tab=transactions`               | —                                                                | ✅**تم إنشاؤه**             |
| 22 | **`withdrawal_requests`** | ✅`/dashboard/withdrawals`                            | ✅`approve`, `reject`                                         | ✅**تم إنشاؤه**             |
| 23 | `user_ratings`                  | ⚠️ مفقود (غير `ratings`)                    | ❌                                                                | ⚠️ يحتاج دمج                    |

---

## 🔴 الأشياء المفقودة بالكامل (الأولوية القصوى)

### 1. 💰 صفحة المحافظ (Wallets) — مفقودة تماماً

CAUTION

الجداول `driver_wallets`, `user_wallets`, `wallet_transactions` موجودة في الداتابيز لكن **لا توجد أي صفحة أدمن** لإدارتها!

**المطلوب إنشاءه:**

* **صفحة `/dashboard/wallets`** — تعرض:
  * محافظ السائقين (`driver_wallets`): الرصيد، إجمالي الأرباح، إجمالي المسحوب، معدل العمولة
  * محافظ المستخدمين (`user_wallets`): الرصيد، إجمالي المصروف، إجمالي الشحن
  * معاملات المحافظ (`wallet_transactions`): النوع، المبلغ، الرصيد قبل/بعد، المرجع
* **API Routes المطلوبة:**
  * `POST /api/wallets/adjust` — تعديل رصيد (bonus/penalty/adjustment)
  * `POST /api/wallets/top-up` — شحن محفظة مستخدم

**أعمدة الجداول:**

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60"></div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">driver_wallets: id, balance, total_earned, total_withdrawn, commission_rate, pending_withdrawal, updated_at</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">user_wallets: id, balance, total_spent, total_topped_up, updated_at</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">wallet_transactions: id, wallet_id, wallet_type, type(enum), amount, balance_before, balance_after, reference_id, reference_type, status(enum), description, created_at</span></div></div></div></div></div></div></pre>

### 2. 🏧 صفحة طلبات السحب (Withdrawals) — مفقودة تماماً

CAUTION

جدول `withdrawal_requests` موجود بالداتابيز و عنده enums (`withdrawal_status`, `withdrawal_method`) لكن **لا يوجد أي تحكم أدمن** فيه!

**المطلوب إنشاءه:**

* **صفحة `/dashboard/withdrawals`** — تعرض:
  * طلبات السحب المعلقة/المعالجة/المكتملة/المرفوضة
  * تفاصيل الطلب: السائق، المبلغ، طريقة الدفع، بيانات الحساب
  * زر قبول/رفض الطلب
* **API Routes المطلوبة:**
  * `POST /api/withdrawals/approve` — قبول طلب سحب
  * `POST /api/withdrawals/reject` — رفض طلب سحب

**أعمدة الجدول:**

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60"></div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">withdrawal_requests: id, driver_id, amount, status(enum), idempotency_key, payment_method(enum), account_details(jsonb), admin_id, rejection_reason, transaction_id, admin_notes, created_at, updated_at</span></div></div></div></div></div></div></pre>

**Enums:**

* `withdrawal_status`: pending, approved, processing, completed, rejected, cancelled
* `withdrawal_method`: bank_transfer, vodafone_cash, instapay, orange_money

### 3. ⭐ صفحة تقييمات المستخدمين (User Ratings) — مفقودة

WARNING

جدول `user_ratings` (تقييم المستخدم للسائق) منفصل عن جدول `ratings` (تقييم السائق). الصفحة الحالية `/dashboard/ratings` بتعرض جدول `ratings` فقط.

**المطلوب:** دمج `user_ratings` في صفحة التقييمات أو إنشاء تاب منفصل.

---

## ⚠️ صفحات موجودة لكن ناقصة

### 4. 💬 صفحة الرسائل — تحتاج تطوير

WARNING

صفحة `/dashboard/messages` بتعرض `support_messages` فقط. جدول `messages` (رسائل الشات بين المستخدم والسائق) **غير معروض** للأدمن.

**المطلوب:**

* إضافة تاب لعرض رسائل الرحلات (جدول `messages`)
* فلترة حسب الرحلة (`trip_id`)
* عرض المحادثات بين المستخدم والسائق

### 5. 🔄 صفحة عروض الرحلات — تحتاج API

NOTE

الصفحة موجودة لكن **لا يوجد API routes** لإدارة العروض (مثلاً: إلغاء عرض معلق).

---

## 📋 Sidebar Navigation — عناصر مفقودة

الـ Sidebar الحالي فيه  **15 عنصر** . المفقود:

| العنصر المطلوب     | الأيقونة المقترحة | الجدول                                                  |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| **المحافظ**        | `Wallet`                        | `driver_wallets`, `user_wallets`, `wallet_transactions` |
| **طلبات السحب** | `Banknote`                      | `withdrawal_requests`                                       |

---

## 📊 Views الداتابيز — التغطية

| View                            | مستخدم في الداشبورد؟ | الملاحظات                                             |
| ------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `admin_dashboard`             | ❌ غير مستخدم                 | الداشبورد بيحسب كل شيء يدوياً!        |
| `admin_audit_log`             | ❌ غير مستخدم                 | صفحة admin-logs بتقرأ من الجدول مباشرة  |
| `admin_pending_verifications` | ❌ غير مستخدم                 | صفحة drivers بتبني الكويري يدوياً        |
| `admin_recent_trips`          | ❌ غير مستخدم                 | الداشبورد بيقرأ من جدول trips مباشرة |
| `admin_users_list`            | ❌ غير مستخدم                 | صفحة users بتقرأ من الجدول مباشرة       |
| `driver_earnings_detailed`    | ❌ غير مستخدم                 | **مفقود — صفحة أرباح السائقين**   |
| `driver_earnings_summary`     | ❌ غير مستخدم                 | **مفقود — ملخص الأرباح**                |
| `driver_public_profile`       | —                                     | للاستخدام الخارجي                              |
| `public_driver_profiles`      | —                                     | للاستخدام الخارجي                              |
| `public_user_profiles`        | —                                     | للاستخدام الخارجي                              |
| `user_trip_stats`             | ❌ غير مستخدم                 | **يمكن دمجه في صفحة المستخدمين** |

TIP

**توصية:** استخدام الـ Views الجاهزة بدلاً من بناء الكويريات يدوياً — هيحسن الأداء ويقلل الكود.

---

## 🎯 خطة التنفيذ بالأولوية

### 🔴 أولوية قصوى (P0) — الداشبورد لا يعمل بدونها

| # | المهمة                             | الملفات المطلوبة                                        |
| - | ---------------------------------------- | ---------------------------------------------------------------------- |
| 1 | **صفحة المحافظ**        | `src/app/dashboard/wallets/page.tsx`, `wallets-client.tsx`         |
| 2 | **صفحة طلبات السحب** | `src/app/dashboard/withdrawals/page.tsx`, `withdrawals-client.tsx` |
| 3 | **API قبول/رفض سحب**     | `src/app/api/withdrawals/approve/route.ts`, `reject/route.ts`      |
| 4 | **API تعديل رصيد**        | `src/app/api/wallets/adjust/route.ts`                                |
| 5 | **إضافة Sidebar items**       | تعديل `src/components/sidebar.tsx`                              |

### 🟡 أولوية عالية (P1) — تحسينات مهمة

| # | المهمة                                             | الملفات المطلوبة                        |
| - | -------------------------------------------------------- | ------------------------------------------------------ |
| 6 | **دمج رسائل الرحلات في Messages** | تعديل `src/app/dashboard/messages/page.tsx`     |
| 7 | **دمج user_ratings في التقييمات**    | تعديل `src/app/dashboard/ratings/page.tsx`      |
| 8 | **استخدام Views الجاهزة**            | تعديل `page.tsx` في dashboard, users, drivers |

### 🟢 أولوية متوسطة (P2) — تحسينات إضافية

| #  | المهمة                                                                                        |
| -- | --------------------------------------------------------------------------------------------------- |
| 9  | إضافة صفحة أرباح السائقين (باستخدام `driver_earnings_summary` view) |
| 10 | إضافة API لإدارة عروض الرحلات                                                 |
| 11 | إضافة تصدير CSV للبيانات                                                          |

---

## 📐 هيكل الملفات المطلوب إنشاءه

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60"></div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">src/app/dashboard/</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">├── wallets/                    ← 🆕 مفقود</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">│   ├── page.tsx               ← صفحة عرض المحافظ</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">│   └── wallets-client.tsx     ← مكون الفلاتر والتفاعل</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">├── withdrawals/                ← 🆕 مفقود</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">│   ├── page.tsx               ← صفحة طلبات السحب</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1">│   └── withdrawals-client.tsx ← مكون الفلاتر والتفاعل</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1">src/app/api/</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1">├── wallets/                    ← 🆕 مفقود</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1">│   └── adjust/</span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk1">│       └── route.ts           ← API تعديل الرصيد</span></div></div><div class="code-line" data-line-number="13" data-line-start="13" data-line-end="13"><div class="line-content"><span class="mtk1">├── withdrawals/                ← 🆕 مفقود</span></div></div><div class="code-line" data-line-number="14" data-line-start="14" data-line-end="14"><div class="line-content"><span class="mtk1">│   ├── approve/</span></div></div><div class="code-line" data-line-number="15" data-line-start="15" data-line-end="15"><div class="line-content"><span class="mtk1">│   │   └── route.ts           ← API قبول طلب سحب</span></div></div><div class="code-line" data-line-number="16" data-line-start="16" data-line-end="16"><div class="line-content"><span class="mtk1">│   └── reject/</span></div></div><div class="code-line" data-line-number="17" data-line-start="17" data-line-end="17"><div class="line-content"><span class="mtk1">│       └── route.ts           ← API رفض طلب سحب</span></div></div></div></div></div></div></pre>

---

IMPORTANT

**ملخص:** من أصل 20 جدول في الداتابيز، **5 جداول مالية مهمة جداً** (محافظ + سحب + معاملات) ليس لها أي واجهة أدمن. هذا يعني أن الأدمن  **لا يستطيع** :

* رؤية أرصدة السائقين أو المستخدمين
* قبول أو رفض طلبات السحب
* عرض سجل المعاملات المالية
* تعديل أرصدة (مثل إعطاء بونص أو خصم غرامة)

**هذا كله لازم يتبني فوراً.**
