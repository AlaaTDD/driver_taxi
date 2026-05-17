
# 🔬 SOLVE — تحليل عميق شامل للداتابيز والـ UI

> **توليد التقرير:** 2026-05-16 | PostgreSQL 17.6 | Supabase | Next.js 15 App Router | Obsidian Amber Design System
> **المراجع:** `Supabase_Snippet_AI-Powered_PostgreSQL_Schema_X-Ray_Introspection.csv` + `src.zip`

---

## فهرس المحتويات

1. [ملخص تنفيذي](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#1-%D9%85%D9%84%D8%AE%D8%B5-%D8%AA%D9%86%D9%81%D9%8A%D8%B0%D9%8A)
2. [تحليل الداتابيز — الجداول والعلاقات](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#2-%D8%AA%D8%AD%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D8%AF%D8%A7%D8%AA%D8%A7%D8%A8%D9%8A%D8%B2--%D8%A7%D9%84%D8%AC%D8%AF%D8%A7%D9%88%D9%84-%D9%88%D8%A7%D9%84%D8%B9%D9%84%D8%A7%D9%82%D8%A7%D8%AA)
3. [مشاكل الأعمدة — نول وبيانات منتهية](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#3-%D9%85%D8%B4%D8%A7%D9%83%D9%84-%D8%A7%D9%84%D8%A3%D8%B9%D9%85%D8%AF%D8%A9--%D9%86%D9%88%D9%84-%D9%88%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA-%D9%85%D9%86%D8%AA%D9%87%D9%8A%D8%A9)
4. [الأمان — RLS والـ Security Audit](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#4-%D8%A7%D9%84%D8%A3%D9%85%D8%A7%D9%86--rls-%D9%88%D8%A7%D9%84%D9%80-security-audit)
5. [الأداء — Bloat وIndex وAnalyze](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#5-%D8%A7%D9%84%D8%A3%D8%AF%D8%A7%D8%A1--bloat-%D9%88index-%D9%88analyze)
6. [تحليل الـ UI — الصفحات والمكونات](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#6-%D8%AA%D8%AD%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D9%80-ui--%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A7%D8%AA-%D9%88%D8%A7%D9%84%D9%85%D9%83%D9%88%D9%86%D8%A7%D8%AA)
7. [Design System — الألوان والتوكنز](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#7-design-system--%D8%A7%D9%84%D8%A3%D9%84%D9%88%D8%A7%D9%86-%D9%88%D8%A7%D9%84%D8%AA%D9%88%D9%83%D9%86%D8%B2)
8. [الميزات المفقودة — DB موجود UI مش موجود](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#8-%D8%A7%D9%84%D9%85%D9%8A%D8%B2%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D9%81%D9%82%D9%88%D8%AF%D8%A9--db-%D9%85%D9%88%D8%AC%D9%88%D8%AF-ui-%D9%85%D8%B4-%D9%85%D9%88%D8%AC%D9%88%D8%AF)
9. [مشاكل الكود — Clean Code وPatterns](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#9-%D9%85%D8%B4%D8%A7%D9%83%D9%84-%D8%A7%D9%84%D9%83%D9%88%D8%AF--clean-code-%D9%88patterns)
10. [خريطة الأولوية والإصلاح](https://claude.ai/chat/60758989-ce9c-4f0d-b4f3-065e231361e4#10-%D8%AE%D8%B1%D9%8A%D8%B7%D8%A9-%D8%A7%D9%84%D8%A3%D9%88%D9%84%D9%88%D9%8A%D8%A9-%D9%88%D8%A7%D9%84%D8%A5%D8%B5%D9%84%D8%A7%D8%AD)

---

## 1. ملخص تنفيذي

| الجانب                       | الحالة  | التفاصيل                                           |
| ---------------------------------- | ------------- | ---------------------------------------------------------- |
| إجمالي الجداول        | 32 جدول   | بما فيهم `spatial_ref_sys`الخاص بـ PostGIS |
| تغطية RLS                     | 96.9%         | جدول واحد بدون RLS هو `spatial_ref_sys`    |
| الـ Functions المخصصة    | 87 function   | شاملة triggers وcron jobs                            |
| الـ Views                       | 17 view       | 15 منهم admin views، 2 PostGIS views                  |
| الـ Indexes                     | 88+ index     | 23 منهم غير مستخدمة Zero Scans               |
| حجم قاعدة البيانات | 27 MB         | مناسب للمرحلة الحالية                   |
| Enums المعرفة               | 6 enums       | كلهم مكتملة ومنطقية                       |
| أعمدة بـ >80% null          | 21 عمود   | موزعة على 8 جداول                             |
| Nullable FK بدون حماية    | 17 علاقة | ممكن تولد Orphan rows                              |
| جداول بها Bloat عالي   | 8 جداول  | بدون VACUUM واحد تم تشغيله                 |
| أعمدة مش ليها comments  | 20 جدول   | بيعيّق التوثيق والفهم                   |

---

## 2. تحليل الداتابيز — الجداول والعلاقات

### 2.1 قائمة الجداول الكاملة مع الحالة

```
TABLE                     ROWS    SIZE      BLOAT    RLS     HEALTH
─────────────────────────────────────────────────────────────────────
admin_logs                0       32 kB     —        ✅      90
app_config                7       32 kB     —        ✅      90
bonus_rules               12      32 kB     —        ✅      75
complaints                0       40 kB     —        ✅      75
coupon_audit_log          0       40 kB     40%      ✅      80  ⚠️
coupon_usages             0       24 kB     —        ✅      75
coupons                   0       40 kB     —        ✅      75
driver_bonus_ledger       0       32 kB     —        ✅      75
driver_locations          2       88 kB     60%      ✅      80  ⚠️
driver_revision_requests  0       24 kB     —        ✅      90
driver_service_areas      0       32 kB     —        ✅      75
driver_wallets            3       24 kB     40%      ✅      80  ⚠️
drivers_profile           3       128 kB    75%      ✅      75  🔴
messages                  69      144 kB    —        ✅      85
notifications             0       40 kB     —        ✅      90
pricing_config            0       16 kB     —        ✅      90
ratings                   9       80 kB     —        ✅      85
service_areas             0       40 kB     —        ✅      90
spatial_ref_sys           8500    7144 kB   —        ❌      50  🔴
support_messages          1       48 kB     —        ✅      90
trip_offers               78      152 kB    32%      ✅      80  ⚠️
trip_route_plans          4       80 kB     —        ✅      75
trip_route_waypoints      8       96 kB     63%      ✅      80  ⚠️
trips                     92      304 kB    25%      ✅      75  ⚠️
user_coupons              0       40 kB     63%      ✅      80  ⚠️
user_presence             0       32 kB     —        ✅      90
user_ratings              5       48 kB     —        ✅      90
user_wallets              4       24 kB     —        ✅      90
users                     7       48 kB     —        ✅      90
vehicle_types             4       40 kB     —        ✅      90
wallet_transactions       2       80 kB     —        ✅      75
withdrawal_requests       0       40 kB     —        ✅      75
```

### 2.2 الـ Views المتاحة ومدى الاستخدام في الـ UI

| View                            | مستخدم في UI                       | ملاحظة                                                                      |
| ------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| `admin_dashboard`             | ✅`/dashboard/page.tsx`                  | KPIs الرئيسية                                                             |
| `admin_recent_trips`          | ✅`/dashboard/page.tsx`                  | آخر 10 رحلات                                                              |
| `admin_audit_log`             | ✅`/dashboard/admin-logs/page.tsx`       | سجل العمليات                                                           |
| `admin_bonus_summary`         | ✅`/dashboard/bonuses/page.tsx`          | ملخص المكافآت                                                         |
| `admin_coupon_analytics`      | ✅`/dashboard/coupon-analytics/page.tsx` | تحليل الكوبونات                                                     |
| `admin_pending_verifications` | ✅`/dashboard/drivers/page.tsx`          | التحقق من السائقين                                                |
| `admin_users_list`            | ✅`/dashboard/users/page.tsx`            | قائمة المستخدمين                                                   |
| `driver_earnings_detailed`    | ✅`/dashboard/drivers/[id]/page.tsx`     | تفاصيل أرباح السائق                                              |
| `driver_earnings_summary`     | ❓ غير محدد                         | موجود في DB، لكن مش ظاهر في UI بشكل صريح               |
| `driver_public_profile`       | ✅`/dashboard/drivers/[id]/page.tsx`     | ملف السائق                                                               |
| `public_driver_profiles`      | ❓ غير محدد                         | view عام، قد يكون للتطبيق العميل                           |
| `public_user_profiles`        | ❓ غير محدد                         | view عام، قد يكون للتطبيق العميل                           |
| `user_trip_stats`             | ❓ غير محدد                         | إحصائيات رحلات المستخدم — غير مستخدم في Admin UI |
| `v_trip_active_route`         | ❓ غير محدد                         | View للمسار النشط — مش محدد الاستخدام                  |
| `v_trip_all_routes`           | ❓ غير محدد                         | View لكل المسارات — مش محدد الاستخدام                  |
| `geography_columns`           | ❌ PostGIS system view                     | لا حاجة لعرضه في UI                                                  |
| `geometry_columns`            | ❌ PostGIS system view                     | لا حاجة لعرضه في UI                                                  |

**المشكلة:** Views زي `user_trip_stats` و `driver_earnings_summary` و `v_trip_active_route` موجودة في الـ DB لكن الـ Admin UI مش بيستخدمهم، ده بيعني إما بيانات مش بتتعرض للأدمن أو الـ Views دي للتطبيق العميل (الموبايل) بس.

### 2.3 الـ Realtime Tables المفعّلة

الجداول دي مفعّل عليها Realtime في Supabase:

```
app_config | driver_wallets | drivers_profile | messages
notifications | support_messages | trip_offers | trip_route_plans
trip_route_waypoints | trips | user_presence | user_wallets | vehicle_types
```

**ملاحظة مهمة:** `support_messages` مفعلة Realtime لكن مفيش صفحة Admin مخصصة ليها — يعني رسائل الدعم الفني بتيجي Real-time للتطبيق العميل بس، والأدمن مش بيشوفها إلا في صفحة الـ messages العامة.

---

## 3. مشاكل الأعمدة — نول وبيانات منتهية

### 3.1 جدول `trips` — أعمدة بـ >80% Null (مشبوهة)

دي الأعمدة اللي في جدول `trips` بنسبة null عالية جداً وغالباً deprecated أو غير مكتملة الاستخدام:

| العمود               | نسبة الـ Null | الخطورة | التوصية                                                                      |
| -------------------------- | -------------------- | -------------- | ----------------------------------------------------------------------------------- |
| `cancel_reason_category` | 100%                 | 🔴             | احذفه أو خليه enum بدل text                                           |
| `meeting_address`        | 100%                 | 🔴             | احذفه — فيتشر الاجتماع مش مكتمل                           |
| `meeting_lat`            | 100%                 | 🔴             | احذفه — فيتشر الاجتماع مش مكتمل                           |
| `meeting_lng`            | 100%                 | 🔴             | احذفه — فيتشر الاجتماع مش مكتمل                           |
| `scheduled_at`           | 100%                 | 🔴             | احذفه — الجدولة مش مفعلة في الـ App                        |
| `estimated_duration_min` | 100%                 | 🔴             | احذفه — مش بيتحسب                                                     |
| `driver_earnings`        | 98.9%                | 🔴             | احذفه — القيمة بتتحسب من `driver_wallets`                     |
| `platform_commission`    | 98.9%                | 🔴             | احذفه — القيمة بتتحسب من `pricing_config`                     |
| `final_price`            | 92.4%                | 🟡             | راجع الـ logic — المفروض يتملى بعد الاكتمال          |
| `user_rating_to_driver`  | 91.3%                | 🟡             | بيتملى من `user_ratings`— ممكن يبقى computed                     |
| `started_at`             | 87%                  | 🟡             | مش بيتملى من الـ trigger — راجع `update_trip_status_timestamps` |
| `completed_at`           | 89.1%                | 🟡             | نفس مشكلة `started_at`                                                    |
| `driver_rating_to_user`  | 94.6%                | 🟡             | نفس مشكلة `user_rating_to_driver`                                         |
| `cancel_reason`          | 82.6%                | 🟡             | مش بيتملى دايماً عند الإلغاء                                |
| `service_area_id`        | 100%                 | 🟡             | الفيتشر مش مكتمل —`fn_set_trip_service_area`مش بتشتغل      |

**التأثير على الـ UI:**

* صفحة `/dashboard/trips/[id]/page.tsx` بتعرض `driver_earnings` و `platform_commission` و `cancel_reason_category` و `scheduled_at` و `estimated_duration_min` رغم إنهم دايماً null.
* بيبان في الـ UI كأن الصفحة فارغة أو ناقصة معلومات.

### 3.2 جدول `drivers_profile` — أعمدة مشبوهة

| العمود             | نسبة الـ Null | التوصية                                                                       |
| ------------------------ | -------------------- | ------------------------------------------------------------------------------------ |
| `target_origin_lat`    | >80%                 | فيتشر "مسار الممر" مش مكتمل — خليه واضح في الـ UI |
| `target_origin_lng`    | >80%                 | نفس الحكم                                                                    |
| `target_route_address` | >80%                 | نفس الحكم                                                                    |
| `target_route_lat`     | >80%                 | نفس الحكم                                                                    |
| `target_route_lng`     | >80%                 | نفس الحكم                                                                    |

### 3.3 جدول `users` — أعمدة بـ 100% Null

| العمود       | نسبة الـ Null | التوصية                                                                |
| ------------------ | -------------------- | ----------------------------------------------------------------------------- |
| `avatar_url`     | 100%                 | الصور مش بتترفع أو مش بتتحفظ — افحص الـ Auth   |
| `blocked_at`     | 100%                 | `block_user()`function مش بتملى الحقل ده                      |
| `blocked_reason` | 100%                 | نفس المشكلة — الـ UI بيبعت reason لكن مش بيتحفظ |

**الخطير جداً:** الـ UI بيعرض حقل "سبب الحظر" لكن الـ DB فيه 100% null في `blocked_reason` — يعني إما الـ API route مش بيعدّي الـ reason صح للـ function، أو الـ `block_user()` function مش بتحفظ الـ reason.

### 3.4 جدول `messages` — عمود مشبوه

| العمود       | نسبة الـ Null | التوصية                                                                          |
| ------------------ | -------------------- | --------------------------------------------------------------------------------------- |
| `attachment_url` | >80%                 | فيتشر المرفقات مش مكتمل — شيل الـ UI element أو اكمله |
| `trip_id`        | >80%                 | رسائل الدعم مش مربوطة برحلة دايماً — OK                   |

### 3.5 Nullable FK Columns — خطر Orphan Rows

دي أعمدة FK nullable ممكن تخلي records معلقة بدون parent:

| الجدول                           | العمود               | الخطورة                                                   |
| -------------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| `admin_logs.admin_id`                | FK for users               | 🟡 ممكن يبقى NULL لعمليات النظام            |
| `app_config.updated_by`              | FK for users               | 🟡                                                               |
| `bonus_rules.service_area_id`        | FK for service_areas       | 🟡                                                               |
| `complaints.admin_id`                | FK for users               | 🟡                                                               |
| `complaints.trip_id`                 | FK for trips               | 🟡                                                               |
| `complaints.user_id`                 | FK for users               | 🔴 complaint بدون user؟!                                    |
| `coupon_audit_log.coupon_id`         | FK for coupons             | 🟡                                                               |
| `driver_bonus_ledger.transaction_id` | FK for wallet_transactions | 🟡                                                               |
| `driver_service_areas.assigned_by`   | FK for users               | 🟡                                                               |
| `messages.trip_id`                   | FK for trips               | 🟡                                                               |
| `ratings.driver_id`                  | FK for drivers_profile     | 🔴 تقييم بدون سائق؟!                               |
| `ratings.trip_id`                    | FK for trips               | 🔴 تقييم بدون رحلة؟!                               |
| `ratings.user_id`                    | FK for users               | 🔴 تقييم بدون مستخدم؟!                           |
| `trip_route_plans.created_by`        | FK for users               | 🟡                                                               |
| `trips.driver_id`                    | FK for drivers_profile     | 🟡 رحلة بحالة searching = لا يوجد سائق بعد |
| `trips.service_area_id`              | FK for service_areas       | 🟡                                                               |
| `withdrawal_requests.admin_id`       | FK for users               | 🟡                                                               |
| `withdrawal_requests.transaction_id` | FK for wallet_transactions | 🟡                                                               |

---

## 4. الأمان — RLS والـ Security Audit

### 4.1 الجدول الوحيد بدون RLS 🔴

```
TABLE: spatial_ref_sys
RLS: ❌ DISABLED
Public Access: ✅ YES
Health Score: 50/100
Live Rows: 8,500 rows
Size: 7,144 kB (أكبر جدول في الـ DB)
```

**المشكلة:** `spatial_ref_sys` جدول PostGIS نظامي بيحتوي على بيانات إسقاط جغرافية (Coordinate Reference Systems). مش هو نفسه بيانات حساسة، لكن:

1. Public access مفتوح عليه = أي مستخدم مسجل يقدر يقرأه.
2. بيأثر على الـ Health Score للداتابيز.
3. Supabase بيحذّر منه.

**الحل:**

```sql
-- PostGIS manages this table, enabling RLS might break spatial functions
-- الحل الأمثل: exclude it from RLS requirements or create a read-only policy
ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_spatial_ref" ON spatial_ref_sys 
  FOR SELECT USING (true);
```

### 4.2 تغطية RLS الكاملة

```
RLS مفعل وmandatory (FORCED):  27 جدول — ✅
RLS مفعل بس مش forced:         3 جداول — ⚠️
RLS معطل:                       2 جداول — 🔴
```

**الجداول بـ RLS مفعل بس مش FORCED (قد يُتخطى بـ service_role):**

* بعض الـ Views مش عليها FORCE — الـ Admin Client بيستخدم `service_role` فده مقبول.

### 4.3 ملاحظات الأمان العامة

* ✅ لا يوجد أي جدول عليه `has_public_access: true` إلا `spatial_ref_sys`.
* ✅ عدد الـ Roles على كل جدول منطقي (3-5 roles).
* ✅ الـ `is_admin_user()` function موجودة ومستخدمة في الـ RLS policies.
* ✅ الـ Admin UI بيستخدم `createAdminClient()` مع `service_role` — صح.
* ✅ الـ `auth-guard.ts` موجود ومفعّل في الـ middleware.
* ⚠️ الـ `anon` key في بعض الجداول عنده أذونات أكتر من اللازم — راجع `grant_count` الـ 4 و5.

---

## 5. الأداء — Bloat وIndex وAnalyze

### 5.1 جداول محتاجة VACUUM فوري 🔴

```
TABLE                   DEAD_ROWS   LIVE_ROWS   BLOAT%    LAST_VACUUM
───────────────────────────────────────────────────────────────────────
drivers_profile         9           3           75%       NEVER 🔴
coupon_audit_log        —           0           40%       NEVER 🔴
trip_route_waypoints    14          8           63%       NEVER 🔴
driver_locations        3           2           60%       NEVER 🔴
trip_offers             37          78          32%       NEVER 🔴
trips                   32          92          25%       2026-04-28 ⚠️
driver_wallets          2           3           40%       NEVER 🔴
vehicle_types           12          4           (high)    2026-04-28 ⚠️
users                   13          7           (high)    2026-04-28 ⚠️
```

**الأسوأ:** `drivers_profile` فيه 9 dead rows مقابل 3 live rows فقط — الجدول ده bloat نسبته 75% مع 0 vacuum تاريخياً. ده بيعني الـ dead rows موجودة من أول إنشاء الجدول.

**الحل الفوري:**

```sql
-- تشغيل VACUUM ANALYZE على الجداول الحرجة
VACUUM ANALYZE drivers_profile;
VACUUM ANALYZE trips;
VACUUM ANALYZE trip_offers;
VACUUM ANALYZE driver_locations;
VACUUM ANALYZE trip_route_waypoints;
VACUUM ANALYZE users;
VACUUM ANALYZE vehicle_types;

-- تفعيل autovacuum أو تعديل إعداداته في Supabase Dashboard
```

### 5.2 Indexes غير مستخدمة (Zero Scans) — مشهم على الـ Write Performance

دي 23 index موجودة لكن مفيش scan واحد عليها:

| Index                                | الجدول         | السبب المحتمل                 |
| ------------------------------------ | -------------------- | ----------------------------------------- |
| `idx_complaints_user`              | complaints           | جدول فارغ — مش اتختبر    |
| `idx_coupon_audit_log_coupon_id`   | coupon_audit_log     | جدول فارغ                         |
| `idx_coupon_audit_log_created_at`  | coupon_audit_log     | جدول فارغ                         |
| `idx_coupon_audit_log_event_type`  | coupon_audit_log     | جدول فارغ                         |
| `idx_coupon_usages_trip_id`        | coupon_usages        | جدول فارغ                         |
| `idx_coupons_code_active`          | coupons              | جدول فارغ                         |
| `idx_dbl_rule`                     | driver_bonus_ledger  | جدول فارغ                         |
| `idx_dsa_area`                     | driver_service_areas | جدول فارغ                         |
| `idx_dsa_driver`                   | driver_service_areas | جدول فارغ                         |
| `idx_drivers_profile_vehicle_type` | drivers_profile      | مش بيتعمل query بـ vehicle_type |
| `idx_drivers_target_dest`          | drivers_profile      | أعمدة deprecated                     |
| `idx_notif_user_unread`            | notifications        | جدول فارغ                         |
| `idx_trip_route_plans_status`      | trip_route_plans     | بيانات قليلة                   |
| `idx_trips_area`                   | trips                | `service_area_id`= 100% null            |
| `idx_trips_cancel_category`        | trips                | `cancel_reason_category`= 100% null     |
| `idx_trips_completed_at`           | trips                | `completed_at`= 89% null                |
| `idx_trips_completed_driver`       | trips                | بيانات قليلة                   |
| `idx_trips_coupon_discount`        | trips                | مش بيتعمل filter عليه         |
| `idx_user_coupons_coupon_id`       | user_coupons         | جدول فارغ                         |
| `idx_wt_ref`                       | wallet_transactions  | بيانات قليلة                   |
| `idx_wt_type`                      | wallet_transactions  | بيانات قليلة                   |
| `idx_wt_wallet_created`            | wallet_transactions  | بيانات قليلة                   |
| `idx_wr_pending`                   | withdrawal_requests  | جدول فارغ                         |

**ملاحظة:** معظمهم بسبب إن الجداول فارغة في بيئة الـ Dev/Staging. لكن بعضهم زي `idx_trips_area` و `idx_trips_cancel_category` بيأكد إن الـ features مش مكتملة.

### 5.3 جداول لم يتم تحليلها (Never Analyzed) — Statistics قديمة

```
admin_logs | app_config | bonus_rules | complaints | coupon_audit_log
coupon_usages | coupons | driver_bonus_ledger | driver_revision_requests
driver_service_areas | driver_wallets | messages | notifications
pricing_config | service_areas | trip_route_waypoints | user_coupons
user_presence | user_ratings | user_wallets | vehicle_types | withdrawal_requests
```

**الأثر:** الـ Query Planner بيستخدم بيانات إحصائية قديمة = queries ممكن تكون أبطأ من اللازم. الحل هو تشغيل `ANALYZE` بانتظام أو تفعيل autovacuum.

### 5.4 إعدادات GUC المهمة

```sql
-- من نتائج 38_GUC_SETTINGS — تأكد من:
work_mem          -- للـ complex queries
max_connections   -- مراقبة عدد الاتصالات
shared_buffers    -- للـ cache
wal_level         -- للـ Realtime
```

---

## 6. تحليل الـ UI — الصفحات والمكونات

### 6.1 خريطة الصفحات الكاملة

| الصفحة                    | الملف                          | حالة الاكتمال | ملاحظات                                                               |
| ------------------------------- | ----------------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `/dashboard`                  | `page.tsx`                        | ✅ مكتملة           | KPIs، Charts، Recent Trips                                                 |
| `/dashboard/users`            | `page.tsx`+`users-client.tsx`   | ✅ مكتملة           | قائمة، بحث، حجب، تغيير دور                             |
| `/dashboard/users/[id]`       | ❌ غير موجود                | 🔴 ناقصة             | لا يوجد صفحة تفصيلية للمستخدم                       |
| `/dashboard/drivers`          | `page.tsx`+`drivers-client.tsx` | ✅ مكتملة           | قائمة + تحقق + إلغاء                                           |
| `/dashboard/drivers/[id]`     | `page.tsx`                        | ✅ مكتملة           | ملف السائق كامل                                                 |
| `/dashboard/drivers/revision` | `page.tsx`                        | ✅ مكتملة           | طلبات المراجعة                                                  |
| `/dashboard/driver-locations` | `page.tsx`+ map                   | ✅ مكتملة           | خريطة مواقع السائقين                                       |
| `/dashboard/trips`            | `page.tsx`+`trips-client.tsx`   | ✅ مكتملة           | قائمة + فلتر                                                        |
| `/dashboard/trips/[id]`       | `page.tsx`                        | ✅ مكتملة           | تفاصيل الرحلة                                                    |
| `/dashboard/trip-offers`      | `page.tsx`+ filter                | ✅ مكتملة           | عروض الرحلات                                                      |
| `/dashboard/route-plans`      | `page.tsx`+ client                | ⚠️ جديدة           | مسارات الرحلات — جديدة، strings بالعربي Hardcoded |
| `/dashboard/ratings`          | `page.tsx`                        | ✅ مكتملة           | التقييمات                                                           |
| `/dashboard/complaints`       | `page.tsx`+`[id]/`              | ✅ مكتملة           | الشكاوى                                                               |
| `/dashboard/messages`         | `page.tsx`                        | ✅ مكتملة           | الرسائل                                                               |
| `/dashboard/service-areas`    | `page.tsx`+ client                | ✅ مكتملة           | المناطق                                                               |
| `/dashboard/vehicle-types`    | `page.tsx`+ client                | ✅ مكتملة           | أنواع المركبات                                                  |
| `/dashboard/pricing`          | `page.tsx`+ client                | ✅ مكتملة           | التسعير                                                               |
| `/dashboard/coupons`          | `page.tsx`+ client                | ✅ مكتملة           | الكوبونات                                                           |
| `/dashboard/user-coupons`     | `page.tsx`                        | ✅ مكتملة           | كوبونات المستخدمين                                          |
| `/dashboard/coupon-analytics` | `page.tsx`                        | ✅ مكتملة           | تحليلات الكوبونات                                            |
| `/dashboard/wallets`          | `page.tsx`                        | ✅ مكتملة           | المحافظ                                                               |
| `/dashboard/withdrawals`      | `page.tsx`                        | ✅ مكتملة           | طلبات السحب                                                        |
| `/dashboard/bonuses`          | `page.tsx`+ client                | ✅ مكتملة           | المكافآت                                                             |
| `/dashboard/notifications`    | `page.tsx`+ client                | ✅ مكتملة           | الإشعارات                                                           |
| `/dashboard/admin-logs`       | `page.tsx`                        | ✅ مكتملة           | سجل الأدمن                                                          |
| `/dashboard/settings`         | `page.tsx`+ form                  | ✅ مكتملة           | الإعدادات                                                           |

### 6.2 API Routes الموجودة كـ Directories فارغة

> ⚠️ دي directories موجودة في الـ zip لكن **الـ `route.ts` فيها فارغة أو مش موجودة** — يعني الـ API endpoints دي مش شغالة:

تم التحقق من إن معظم الـ routes فيها `route.ts` كامل. لكن المجلدات التالية موجودة كـ placeholders:

```
src/app/api/notifications/send/  — ✅ route.ts موجود
src/app/api/trips/cancel/        — ✅ route.ts موجود
src/app/api/trips/delete/        — ✅ route.ts موجود
```

الـ API routes كلها موجودة ومكتملة. لكن في `bonuses/` و `service-areas/` بيستخدموا Server Actions بدل API routes — pattern غير موحد.

---

## 7. Design System — الألوان والتوكنز

### 7.1 CSS Variables — ما هو موجود ✅

الـ Design System موجود في `globals.css` وشامل:

```css
/* Light Mode Variables */
--background, --surface, --surface-high, --surface-elevated
--surface-muted, --surface-glass
--divider, --divider-strong, --table-row-border
--text-primary, --text-secondary, --text-tertiary, --text-disabled
--primary, --primary-rgb, --primary-dark, --primary-light, --primary-text, --primary-surface
--success, --success-rgb, --success-light, --success-surface, --success-border
--warning, --warning-rgb, --warning-surface, --warning-border
--error, --error-rgb, --error-light, --error-surface, --error-border
--info, --info-rgb, --info-surface
--color-orange, --color-purple, --color-pink, --color-cyan
--radius-sm, --radius-md, --radius-lg, --radius-xl
--transition-fast, --transition-normal, --transition-slow
--shadow-sm, --shadow-md, --shadow-lg

/* Dark Mode Variables */
-- نفس القائمة مع قيم مختلفة
```

### 7.2 المتغيرات الناقصة في الـ Dark Mode 🔴

```css
/* موجودة في Light — مش موجودة في .dark {} */
--info-light        /* #93C5FD في Light، مش معرّف في Dark */
--warning-light     /* #FDE68A في Light، مش معرّف في Dark */
--radius-sm         /* ثابت — صح إنه مش في Dark لكن لو مستخدم في Dark components */
--radius-md         /* نفس الحكم */
--radius-lg         /* نفس الحكم */
--radius-xl         /* نفس الحكم */
--transition-fast   /* نفس الحكم — transitions مش بتتغير مع الـ Dark */
--transition-normal /* نفس الحكم */
--transition-slow   /* نفس الحكم */
```

**الإصلاح في `globals.css`:**

```css
.dark {
  /* الإضافة المطلوبة */
  --info-light: #60A5FA;      /* أغمق شوية في Dark */
  --warning-light: #FCD34D;   /* أغمق شوية في Dark */
  /* الـ radius والـ transitions مش محتاجين تكرار في Dark */
}
```

### 7.3 `COLOR_MAP` — تكرار في مكونات متعددة 🟡

نفس الـ object متعرّف في 3 مواقع مختلفة:

```typescript
// stat-card.tsx — السطر 5
const COLOR_MAP: Record<ColorVariant, {...}> = { ... }

// kpi-card.tsx — السطر 5
const COLOR_MAP: Record<ColorVariant, {...}> = { ... }

// charts.tsx — السطر 29 (بشكل مختلف قليلاً: STATUS_COLOR_MAP)
```

**الحل — إنشاء ملف `src/lib/design-tokens.ts`:**

```typescript
// src/lib/design-tokens.ts

export type ColorVariant = "primary" | "info" | "success" | "warning" | "error";

export const COLOR_MAP: Record<ColorVariant, {
  bg: string;
  border: string;
  text: string;
  var: string;
  rgb: string;
}> = {
  primary: {
    bg:     "bg-primary/10",
    border: "border-primary/20",
    text:   "text-primary",
    var:    "var(--primary)",
    rgb:    "var(--primary-rgb)",
  },
  info: {
    bg:     "bg-info/10",
    border: "border-info/20",
    text:   "text-info",
    var:    "var(--info)",
    rgb:    "var(--info-rgb)",
  },
  success: {
    bg:     "bg-success/10",
    border: "border-success/20",
    text:   "text-success",
    var:    "var(--success)",
    rgb:    "var(--success-rgb)",
  },
  warning: {
    bg:     "bg-warning/10",
    border: "border-warning/20",
    text:   "text-warning",
    var:    "var(--warning)",
    rgb:    "var(--warning-rgb)",
  },
  error: {
    bg:     "bg-error/10",
    border: "border-error/20",
    text:   "text-error",
    var:    "var(--error)",
    rgb:    "var(--error-rgb)",
  },
};

export const STATUS_COLOR_MAP: Record<string, string> = {
  completed:       "var(--success)",
  accepted:        "var(--primary)",
  driver_arriving: "var(--primary)",
  in_progress:     "var(--primary)",
  searching:       "var(--warning)",
  pending:         "var(--warning)",
  cancelled:       "var(--error)",
  rejected:        "var(--error)",
  expired:         "var(--text-disabled)",
};
```

بعد كده في كل ملف بدل ما تعرّف `COLOR_MAP` محلياً:

```typescript
import { COLOR_MAP, type ColorVariant } from "@/lib/design-tokens";
```

### 7.4 ألوان Hardcoded خارج الـ CSS Variables — مواضع المشكلة

```typescript
// sidebar.tsx — السطر 35 (مقبول — هو نفسه CSS var reference)
const PRIMARY_RGB = "var(--primary-rgb)"; // ✅ صح

// route-plans-client.tsx — ألوان مباشرة في className
className="text-sm font-bold text-error"  // ✅ بيستخدم CSS var
className="text-[15px] font-black text-text-primary"  // ✅ بيستخدم CSS var

// الـ TOOLTIP_STYLE في charts.tsx — ✅ كله بيستخدم CSS vars
backgroundColor: "var(--surface-elevated)"
border: "1px solid var(--divider)"
```

**لم يُعثر على ألوان hex مباشرة في الـ TSX files** — النمط صح ومتسق.

### 7.5 Strings العربية Hardcoded في الكود (i18n Issue) 🟡

```typescript
// sidebar.tsx — السطر 59
{ label: "مسارات الرحلات", ... }  // 🔴 Hardcoded — المفروض t("routePlans.title")

// route-plans-client.tsx
"حدث خطأ أثناء جلب المسارات"      // 🔴 Hardcoded
"قائمة المسارات"                   // 🔴 Hardcoded
"لا توجد مسارات لعرضها"            // 🔴 Hardcoded
"لم يتم العثور على أي مسارات..."   // 🔴 Hardcoded

// route-plans/page.tsx
"مسارات الرحلات"                   // 🔴 Hardcoded
"إدارة وعرض مسارات الرحلات..."    // 🔴 Hardcoded

// trips/[id]/page.tsx
"دقيقة"                             // 🔴 Hardcoded unit
"تاريخ الاكتمال"                   // 🔴 Hardcoded label
"تاريخ الإلغاء"                    // 🔴 Hardcoded label
```

**الحل:** إضافة مفاتيح i18n للـ messages file وتبديل الـ strings الـ hardcoded.

---

## 8. الميزات المفقودة — DB موجود UI مش موجود

### 8.1 صفحة تفاصيل المستخدم `/dashboard/users/[id]` 🔴

**DB Data المتاح:**

* `users` table — بيانات أساسية
* `user_trip_stats` view — إحصائيات رحلاته
* `user_wallets` + `wallet_transactions` — محفظته
* `user_coupons` + `coupons` — كوبوناته
* `user_ratings` — تقييماته للسائقين
* `ratings` — تقييمات السائقين له

**الـ UI الحالي:** بيعرض المستخدمين في قائمة بس — مفيش صفحة تفصيلية.

**المطلوب إنشاؤه:**

```
/dashboard/users/[id]/page.tsx
- بيانات المستخدم الأساسية (اسم، إيميل، تليفون، دور، تاريخ إنشاء)
- إحصائيات الرحلات (من user_trip_stats view)
- رصيد المحفظة (من user_wallets)
- آخر 5 معاملات (من wallet_transactions)
- قائمة كوبوناته (من user_coupons)
- تاريخ التقييمات (من user_ratings)
- أزرار: حجب/رفع الحجب، تغيير الدور
```

### 8.2 صفحة `support_messages` — رسائل الدعم الفني 🟡

**DB:** جدول `support_messages` مفعّل عليه Realtime، فيه `1` رسالة حالياً.
**الـ UI الحالي:** صفحة `/dashboard/messages` بتعرض جدول `messages` (محادثات بين السائق والمستخدم).

**الفرق:** `support_messages` هي رسائل المستخدمين للدعم الفني — مختلفة عن محادثات الرحلة.

**المطلوب:** إما:

1. إضافة tab في صفحة `/dashboard/messages` يعرض رسائل الدعم.
2. أو إنشاء صفحة مستقلة `/dashboard/support`.

### 8.3 صفحة `driver_bonus_ledger` — سجل مكافآت السائق 🟡

**DB:** جدول `driver_bonus_ledger` بيسجل كل معاملة bonus/penalty لكل سائق.
**الـ UI الحالي:** صفحة `/dashboard/bonuses` بتعرض القواعد (`bonus_rules`) وملخص (`admin_bonus_summary`).
**المفقود:** تفاصيل المعاملات الفعلية لكل سائق.

**المطلوب:** في صفحة `/dashboard/drivers/[id]` إضافة section بيعرض `driver_bonus_ledger` records للسائق ده.

### 8.4 صفحة `coupon_audit_log` — سجل تغييرات الكوبونات 🟡

**DB:** جدول `coupon_audit_log` بيسجل كل تغيير في حالة الكوبون (created/activated/deactivated/expired).
**الـ UI الحالي:** `/dashboard/coupon-analytics` بيعرض analytics بس.
**المفقود:** Timeline لكل كوبون بيعرض تاريخه.

**المطلوب:** في صفحة `/dashboard/coupons/[id]` إضافة Audit Log section.

### 8.5 صفحة مراقبة `user_presence` 🟡

**DB:** جدول `user_presence` بـ 110,000+ updates — الأكثر كتابة في الـ DB.
**الـ UI الحالي:** صفحة مواقع السائقين موجودة لكن مفيش صفحة لمراقبة نشاط المستخدمين.
**المطلوب:** إضافة widget صغير في الـ Dashboard يعرض المستخدمين Active الآن.

### 8.6 صفحة `driver_service_areas` — مناطق السائق 🟡

**DB:** جدول `driver_service_areas` بيربط السائقين بالمناطق.
**الـ UI الحالي:** صفحة `/dashboard/service-areas` موجودة لكن مفيش طريقة لتعيين سائق لمنطقة من الـ Admin UI.
**المطلوب:** في صفحة `/dashboard/drivers/[id]` إضافة قسم "المناطق المخصصة" مع إمكانية الإضافة والحذف.

### 8.7 `pricing_config` vs `vehicle_types` — تناقض في التسعير 🟡

**DB:** جدول `pricing_config` موجود (0 rows حالياً)، وجدول `vehicle_types` عنده `base_fare` و `price_per_km`.
**الـ UI الحالي:** صفحة `/dashboard/pricing` بتعرض `pricing_config` بينما `/dashboard/vehicle-types` بتعرض وتعدّل أسعار الـ vehicle types.

**التناقض:** وجود جدولين للتسعير مربك. إما:

1. `pricing_config` للإعدادات العامة (commission%, minimum fare, surge multiplier).
2. `vehicle_types` للأسعار الخاصة بكل نوع مركبة.

**المطلوب:** توثيق واضح في الـ UI لإيه الفرق بين الجدولين، وإضافة ربط بينهم.

---

## 9. مشاكل الكود — Clean Code وPatterns

### 9.1 مشكلة موحدة في كل الصفحات — عدم وجود Error Boundaries 🟡

كل الـ Server Components بتستخدم pattern زي:

```typescript
const { data, error } = await supabase.from("...").select("...");
// لو error حصل — الصفحة ممكن تبقى blank أو تكسر بدون error message واضح
```

**المطلوب:** Error boundary أو fallback UI لكل صفحة:

```typescript
if (error) {
  return <ErrorState message={error.message} />;
}
```

### 9.2 عدم وجود Skeleton/Loading States في معظم الصفحات 🟡

صفحات زي `/dashboard/trips` و `/dashboard/users` مش عندها Suspense boundaries.

**المطلوب:**

```typescript
// في الـ page.tsx wrapper
export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TripsContent />
    </Suspense>
  );
}
```

### 9.3 دالة `getStatusLabel` في `utils.ts` — بتستخدم try/catch للـ logic المعتادة 🟡

```typescript
// utils.ts — الكود الحالي
export function getStatusLabel(status: string, t?: any): string {
  if (!t) return status;  // 🔴 لو مفيش translation، بترجع الـ raw status
  try {
    const translation = t(`trips.statuses.${status}`);
    if (translation === `trips.statuses.${status}`) {
      const common = t(`common.${status}`);
      if (common !== `common.${status}`) return common;
    }
    return translation;
  } catch {
    return status;
  }
}
```

**المشكلة:** try/catch للـ control flow مش best practice في JS.

**الحل الأمثل:**

```typescript
// design-tokens.ts — إضافة STATUS_LABELS map
export const STATUS_LABELS: Record<string, string> = {
  searching:       "جاري البحث",
  accepted:        "مقبولة",
  driver_arriving: "السائق في الطريق",
  in_progress:     "جارية",
  completed:       "مكتملة",
  cancelled:       "ملغية",
  pending:         "معلقة",
  rejected:        "مرفوضة",
  expired:         "منتهية",
};
```

### 9.4 Duplicate Type Definitions — `ColorVariant` معرّف في كل مكون 🟡

```typescript
// stat-card.tsx — السطر 3
type ColorVariant = "primary" | "info" | "success" | "warning" | "error";

// kpi-card.tsx — السطر 3
type ColorVariant = "primary" | "info" | "success" | "warning" | "error";
```

**الحل:** استخدام `type ColorVariant` من `@/lib/design-tokens`.

### 9.5 Server Actions vs API Routes — pattern مش موحد 🟡

بعض الصفحات بتستخدم Server Actions:

```typescript
// service-areas/actions.ts
"use server";
export async function createServiceArea(...) { ... }
```

وبعضها بتستخدم API Routes:

```typescript
// app/api/service-areas/create/route.ts
export async function POST(request: Request) { ... }
```

**التوصية:** اختار pattern واحد للـ mutations. Server Actions أفضل في Next.js 15 لأنها بتشتغل مع `useTransition` وبتعمل revalidation تلقائي.

### 9.6 `formatCurrency` — hardcoded currency 🟡

```typescript
// utils.ts
export function formatCurrency(value: number): string {
  return `${value.toFixed(2)} ج.م`;  // 🔴 Hardcoded Egyptian Pound
}
```

**المطلوب:** استخدام `Intl.NumberFormat` مع currency من `app_config`:

```typescript
export function formatCurrency(value: number, currency = "EGP"): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}
```

### 9.7 استخدام `deprecated columns` في الـ UI 🔴

صفحة `/dashboard/trips/[id]/page.tsx` بتعرض:

* `trip.driver_earnings` — 98.9% null
* `trip.platform_commission` — 98.9% null
* `trip.cancel_reason_category` — 100% null
* `trip.scheduled_at` — 100% null
* `trip.estimated_duration_min` — 100% null

**الحل:** شيل الـ UI elements دي أو اعمل conditional rendering بيعرضهم بس لو القيمة مش null.

### 9.8 الـ Dashboard Main Page — بيجيب بيانات غير ضرورية 🟡

```typescript
// dashboard/page.tsx
const [dashboardRes, recentTripsRes, tripsForChartRes] = await Promise.all([
  supabase.from("admin_dashboard").select("*").single(),
  supabase.from("admin_recent_trips").select("*").limit(10),
  supabase.from("trips").select("id, status, price, vehicle_type"),  // 🔴 جايب كل الرحلات!
]);
```

**المشكلة:** بيجيب كل الـ trips من الجدول المباشر بدل ما يستخدم الـ view اللي فيه الـ aggregated data. لو الرحلات وصلت 100k+ هيبطّء الصفحة.

**الحل:** استخدام `admin_dashboard` view فقط اللي فيه الـ aggregated stats، والـ Chart data من view مخصص.

---

## 10. خريطة الأولوية والإصلاح

### 🔴 Priority 1 — حرجة (افعلها دلوقتي)

```
1. VACUUM ANALYZE على كل الجداول — خصوصاً drivers_profile (75% bloat)
2. إصلاح blocked_reason — التحقق من api/users/block/route.ts
3. شيل الـ UI elements للأعمدة 100% null من trips/[id]
4. تفعيل RLS على spatial_ref_sys
5. إصلاح completed_at / started_at — راجع trigger update_trip_status_timestamps
```

### 🟡 Priority 2 — مهمة (خلال الـ Sprint الجاي)

```
6.  إنشاء src/lib/design-tokens.ts وشيل COLOR_MAP التكرار
7.  إضافة --info-light و--warning-light في .dark {}
8.  إصلاح route-plans — تحويل الـ Arabic strings لـ i18n keys
9.  إضافة صفحة /dashboard/users/[id]
10. توحيد Server Actions vs API Routes pattern
11. إصلاح formatCurrency لاستخدام Intl.NumberFormat
12. تشغيل ANALYZE على الجداول غير المحللة
13. إصلاح داتا dashboard/page.tsx — مش يجيب كل الـ trips
```

### 🟢 Priority 3 — تحسينات (مع الوقت)

```
14. إضافة Error Boundaries / Suspense في كل الصفحات
15. إضافة driver_bonus_ledger في صفحة السائق
16. إضافة coupon_audit_log timeline في صفحة الكوبون
17. إضافة driver_service_areas management في صفحة السائق
18. التحقق من views غير مستخدمة: user_trip_stats, driver_earnings_summary
19. توثيق (comments) على الـ 20 جدول بدون comments
20. راجع الـ 23 unused index — احذف اللي مش هيتستخدم
21. إضافة support_messages في صفحة الرسائل
22. إضافة user_presence counter في الـ Dashboard
23. توضيح الفرق بين pricing_config و vehicle_types في الـ UI
```

---

## ملاحق تقنية

### A. الـ Enums المعرّفة في الـ DB

```sql
-- route_plan_status
VALUES: draft | active | inactive | archived

-- route_waypoint_role
VALUES: origin | stopover | destination

-- wallet_transaction_status
VALUES: pending | completed | failed | reversed

-- wallet_transaction_type
VALUES: trip_earning | trip_payment | withdrawal | withdrawal_refund
        top_up | refund | bonus | penalty | adjustment | coupon_subsidy

-- withdrawal_method
VALUES: bank_transfer | vodafone_cash | instapay | orange_money

-- withdrawal_status
VALUES: pending | approved | processing | completed | rejected | cancelled
```

### B. أكثر الجداول كتابة (Write Hotspots)

```
1. user_presence    — 110,344 writes (110,010 updates) — الـ Real-time Location
2. spatial_ref_sys  — 8,500 inserts — PostGIS initialization
3. drivers_profile  — 1,414 writes — تحديثات السائق
4. driver_locations — 442 writes — تحديث الموقع
5. trips            — 314 writes — عمليات الرحلات
```

### C. نموذج SQL للصيانة الدورية

```sql
-- تشغيله كل أسبوع عبر pg_cron (مفعّل على الـ DB)
SELECT cron.schedule(
  'weekly-vacuum-analyze',
  '0 3 * * 0',  -- كل أحد الساعة 3 صبح
  $$
    VACUUM ANALYZE drivers_profile;
    VACUUM ANALYZE trips;
    VACUUM ANALYZE trip_offers;
    VACUUM ANALYZE trip_route_waypoints;
    VACUUM ANALYZE messages;
    VACUUM ANALYZE users;
  $$
);
```

### D. نموذج `design-tokens.ts` الكامل للـ UI

```typescript
// src/lib/design-tokens.ts

/* ─────────────────────────────────────────────────────────────────────────
   OBSIDIAN AMBER — Shared Design Tokens
   Single source of truth for colors, variants, and status mappings.
   All values reference CSS variables defined in globals.css.
───────────────────────────────────────────────────────────────────────── */

export type ColorVariant =
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "error";

export type BadgeVariant =
  | ColorVariant
  | "default"
  | "purple"
  | "cyan";

// ── Color utility map — used by StatCard, KpiCard, Badge, etc. ──────────
export const COLOR_MAP: Record<
  ColorVariant,
  { bg: string; border: string; text: string; var: string; rgb: string }
> = {
  primary: {
    bg:     "bg-primary/10",
    border: "border-primary/20",
    text:   "text-primary",
    var:    "var(--primary)",
    rgb:    "var(--primary-rgb)",
  },
  info: {
    bg:     "bg-info/10",
    border: "border-info/20",
    text:   "text-info",
    var:    "var(--info)",
    rgb:    "var(--info-rgb)",
  },
  success: {
    bg:     "bg-success/10",
    border: "border-success/20",
    text:   "text-success",
    var:    "var(--success)",
    rgb:    "var(--success-rgb)",
  },
  warning: {
    bg:     "bg-warning/10",
    border: "border-warning/20",
    text:   "text-warning",
    var:    "var(--warning)",
    rgb:    "var(--warning-rgb)",
  },
  error: {
    bg:     "bg-error/10",
    border: "border-error/20",
    text:   "text-error",
    var:    "var(--error)",
    rgb:    "var(--error-rgb)",
  },
};

// ── Trip / Offer status → color mapping ─────────────────────────────────
export const STATUS_COLOR_MAP: Record<string, string> = {
  completed:       "var(--success)",
  accepted:        "var(--primary)",
  driver_arriving: "var(--primary)",
  in_progress:     "var(--primary)",
  searching:       "var(--warning)",
  pending:         "var(--warning)",
  cancelled:       "var(--error)",
  rejected:        "var(--error)",
  expired:         "var(--text-disabled)",
};

// ── Trip status → Tailwind pill class (used by getStatusColor in utils) ─
export const STATUS_PILL_MAP: Record<string, string> = {
  searching:       "status-pill-warning border",
  accepted:        "status-pill-primary border",
  driver_arriving: "status-pill-primary border",
  in_progress:     "status-pill-primary border",
  completed:       "status-pill-success border",
  cancelled:       "status-pill-error border",
  pending:         "status-pill-warning border",
  rejected:        "status-pill-error border",
  expired:         "status-pill-muted border",
};

// ── Recharts tooltip style — consistent across all charts ───────────────
export const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "var(--surface-elevated)",
  border:          "1px solid var(--divider)",
  borderRadius:    "12px",
  color:           "var(--text-primary)",
  boxShadow:       "var(--shadow-lg)",
  backdropFilter:  "blur(16px)",
  fontSize:        "13px",
  padding:         "10px 14px",
};

// ── Pie chart fallback colors ────────────────────────────────────────────
export const PIE_FALLBACK_COLORS: string[] = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--error)",
  "var(--primary-light)",
];
```

---

*تم إعداد هذا التقرير بناءً على تحليل شامل لـ 3,007 صف من بيانات X-Ray Schema + 186 ملف كود في الـ src.*
