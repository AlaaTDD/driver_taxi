# 🔍 تحليل شامل — لوحة تحكم تاكسي ويب + قاعدة البيانات

> **تاريخ التحليل:** 2026-05-23
> **المصدر:** Supabase Schema X-Ray Introspection + فحص الكود المصدري
> **PostgreSQL:** 17.6 | **33 جدول** | **98 RPC** | **7 Enums** | **13 جدول Realtime**

---

## جدول المحتويات

1. [ملخص تنفيذي](#1--ملخص-تنفيذي)
2. [مشاكل قاعدة البيانات](#2--مشاكل-قاعدة-البيانات)
3. [جداول وأعمدة غير مستخدمة](#3--جداول-وأعمدة-غير-مستخدمة)
4. [ثغرات أمنية](#4--ثغرات-أمنية)
5. [ميزات مبنية في الداتابيز لكن غير متصلة بالكود](#5--ميزات-مبنية-في-الداتابيز-لكن-غير-متصلة-بالكود)
6. [نواقص في الكود](#6--نواقص-في-الكود)
7. [أداء وصيانة](#7--أداء-وصيانة)
8. [خريطة الميزات: موجود vs ناقص](#8--خريطة-الميزات-موجود-vs-ناقص)
9. [توصيات ذات أولوية](#9--توصيات-ذات-أولوية)

---

## 1 — ملخص تنفيذي

| المقياس | القيمة | الحالة |
|---------|--------|--------|
| عدد الجداول | 33 | ✅ |
| تغطية RLS | 32/33 (97%) | ⚠️ `spatial_ref_sys` مكشوف |
| Realtime | 13 جدول مفعّل | ✅ لكن مستخدم فقط في `driver-locations` |
| جداول خاملة (0 صفوف + 0 كتابة) | 6 جداول | 🔴 |
| أعمدة 100% NULL في trips | 9+ أعمدة | 🔴 |
| Table Bloat > 50% | 9 جداول | ⚠️ |
| صفحات Dashboard | 26 صفحة | ✅ |
| API Routes | 20+ endpoint | ✅ |
| Middleware | ❌ غير موجود | 🔴 حرج |
| Error Boundaries | ❌ غير موجود | 🔴 |
| Loading States | ❌ غير موجود | 🔴 |
| Tests | ❌ صفر اختبارات | 🔴 |
| `.env.example` | ❌ غير موجود | ⚠️ |

---

## 2 — مشاكل قاعدة البيانات

### 2.1 Table Bloat (تضخم الجداول)

| الجدول | نسبة التضخم | Live Rows | Dead Rows |
|--------|------------|-----------|-----------|
| `pricing_config` | **87.5%** | 1 | 7 |
| `vehicle_types` | **81%** | 4 | 17 |
| `complaints` | **72.7%** | 3 | 8 |
| `drivers_profile` | **62.5%** | 3 | 5 |
| `users` | **61.1%** | 7 | 11 |
| `driver_locations` | **60%** | 2 | 3 |
| `trip_route_waypoints` | **56%** | 11 | 14 |
| `support_messages` | **50%** | 7 | 7 |
| `withdrawal_requests` | **50%** | 3 | 3 |

**الحل:** تشغيل `VACUUM FULL` على هذه الجداول أو ضبط `autovacuum` settings:
```sql
-- مثال
ALTER TABLE pricing_config SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE pricing_config SET (autovacuum_analyze_scale_factor = 0.02);
VACUUM FULL pricing_config;
VACUUM FULL vehicle_types;
VACUUM FULL complaints;
```

### 2.2 مشكلة HOT Updates في `driver_locations`

- **HOT Update Ratio: 0%** — كل تحديث ينشئ tuple جديد بدون إعادة استخدام المساحة
- هذا الجدول يتم تحديثه بشكل مستمر (مواقع السائقين GPS)
- **السبب المحتمل:** الأعمدة المفهرسة (`geohash`, `geohash5`, `geom`) تتغير مع كل تحديث

**الحل:**
```sql
-- زيادة FILLFACTOR لتوفير مساحة للتحديثات
ALTER TABLE driver_locations SET (fillfactor = 70);
VACUUM FULL driver_locations;
```

### 2.3 أعمدة مكررة في `trips`

| العمود 1 | العمود 2 | ملاحظة |
|----------|----------|--------|
| `pickup_address` | `origin_address` | نفس المحتوى — حذف أحدهما |
| `destination_address` | `dest_address` | نفس المحتوى — حذف أحدهما |

**الحل:** Migration لدمج الأعمدة المكررة:
```sql
-- بعد التأكد من نقل البيانات
ALTER TABLE trips DROP COLUMN IF EXISTS origin_address;
ALTER TABLE trips DROP COLUMN IF EXISTS dest_address;
```

### 2.4 أعمدة 100% NULL في `trips`

هذه الأعمدة موجودة في الجدول لكن لم تُستخدم أبداً (كل القيم NULL):

| العمود | الغرض المفترض | الحالة |
|--------|--------------|--------|
| `meeting_lat` | نقطة التقابل — خط العرض | 🔴 لم يُستخدم |
| `meeting_lng` | نقطة التقابل — خط الطول | 🔴 لم يُستخدم |
| `meeting_address` | عنوان نقطة التقابل | 🔴 لم يُستخدم |
| `service_area_id` | ربط بمنطقة الخدمة | 🔴 لم يُستخدم |
| `estimated_duration_min` | الوقت المقدر بالدقائق | 🔴 لم يُستخدم |
| `scheduled_at` | الرحلات المجدولة | 🔴 لم يُستخدم |
| `cancel_reason_category` | تصنيف سبب الإلغاء | ⚠️ موجود في الكود لكن بدون بيانات |
| `payment_method` | طريقة الدفع | ⚠️ موجود في الكود لكن بدون بيانات |
| `accepted_at` | وقت قبول السائق | 🔴 لم يُستخدم |
| `started_at` | وقت بدء الرحلة | 🔴 لم يُستخدم |

### 2.5 بيانات Geohash ناقصة في `driver_locations`

- **66.67%** من السائقين لديهم `geohash = NULL` و `geohash5 = NULL`
- هذا يكسر وظيفة `get_nearby_drivers()` التي تعتمد على geohash للبحث السريع
- **الحل:** تحديث الـ trigger أو RPC ليحسب geohash تلقائياً عند كل تحديث موقع

### 2.6 جدول `support_tickets` بدون ANALYZE

- آخر تحليل: **لم يتم أبداً** (`last_analyze = NULL`)
- يؤثر على أداء الاستعلامات — query planner يستخدم إحصائيات قديمة
- **الحل:** `ANALYZE support_tickets;`

### 2.7 الجداول بدون توثيق (Missing Comments)

21 جدول من 33 ليس لديهم `COMMENT` — يصعب على المطورين الجدد فهم الغرض:

> `admin_logs`, `app_config`, `complaints`, `coupon_audit_log`, `coupon_usages`, `coupons`, `driver_bonus_ledger`, `driver_documents`, `driver_locations`, `driver_revision_requests`, `driver_service_areas`, `drivers_profile`, `notifications`, `pricing_config`, `ratings`, `route_plans`, `service_areas`, `support_messages`, `support_tickets`, `trip_offers`, `trip_route_waypoints`

---

## 3 — جداول وأعمدة غير مستخدمة

### 3.1 جداول خاملة تماماً (IDLE)

| الجدول | الصفوف | عمليات الكتابة | ملاحظة |
|--------|--------|---------------|--------|
| `coupon_audit_log` | 0 | 0 | سجل مراجعة الكوبونات — لم يُفعّل |
| `coupon_usages` | 0 | 0 | تتبع استخدام الكوبونات — لم يُفعّل |
| `driver_bonus_ledger` | 0 | 0 | سجل المكافآت المالية — لم يُفعّل |
| `driver_revision_requests` | 0 | 0 | طلبات مراجعة وثائق السائق |
| `driver_service_areas` | 0 | 0 | ربط السائقين بمناطق الخدمة |
| `notifications` | 0 | 0 | نظام الإشعارات كامل لكن خامل |

### 3.2 Enums غير مستخدمة

- `cancel_reason_category_enum`: معرّف في الداتابيز لكن لم يُملأ أبداً
- `payment_method_enum`: لم تُسجل أي طريقة دفع فعلياً

---

## 4 — ثغرات أمنية

### 4.1 🔴 حرج: لا يوجد `middleware.ts`

**لا يوجد ملف middleware في المشروع بالكامل.** هذا يعني:

1. ❌ لا يتم تحديث session/token تلقائياً — المستخدم قد يُطرد فجأة
2. ❌ لا توجد حماية للمسارات على مستوى middleware — أي شخص يمكنه الوصول لـ `/dashboard/*`
3. ❌ لا يتم إعادة التوجيه من `/` للداشبورد إذا كان مسجل دخول
4. ❌ لا يتم توجيه غير المسجلين من `/dashboard` لصفحة الدخول

**الحل المطلوب:** إنشاء `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // حماية مسارات الداشبورد
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // توجيه المسجلين من صفحة الدخول
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

### 4.2 ⚠️ `spatial_ref_sys` بدون RLS

- الجدول الوحيد بدون Row Level Security
- جدول PostGIS نظامي — خطورة منخفضة لكن يفضل تفعيل RLS:
```sql
ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;
```

### 4.3 ⚠️ لا يوجد `.env.example`

- يوجد `.env.local` لكن لا يوجد `.env.example` لتوثيق المتغيرات المطلوبة
- أي مطور جديد لن يعرف المتغيرات المطلوبة لتشغيل المشروع

**الحل:** إنشاء `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 4.4 ⚠️ Service Role Key في الـ Client-Side

- يُستخدم `createAdminClient()` (service_role) في Server Components — وهذا آمن حالياً
- لكن بدون middleware، لا توجد طبقة حماية إضافية قبل الوصول لهذه الصفحات

---

## 5 — ميزات مبنية في الداتابيز لكن غير متصلة بالكود

### 5.1 🔴 نظام الرحلات المجدولة (Scheduled Rides)

- **الداتابيز:** عمود `scheduled_at` في `trips` + `trip_status_enum` يتضمن حالات جدولة
- **الكود:** لا توجد واجهة لجدولة الرحلات ولا عرض الرحلات المجدولة
- **المطلوب:** إضافة فلتر "الرحلات المجدولة" + واجهة إنشاء رحلة مجدولة

### 5.2 🔴 نقطة التقابل (Meeting Point)

- **الداتابيز:** أعمدة `meeting_lat`, `meeting_lng`, `meeting_address` في `trips`
- **الكود:** لا يوجد أي استخدام لهذه الحقول
- **المطلوب:** عرض نقطة التقابل على الخريطة في تفاصيل الرحلة

### 5.3 🔴 ربط السائقين بمناطق الخدمة

- **الداتابيز:** جدول `driver_service_areas` (many-to-many بين drivers و service_areas)
- **الكود:** صفحة `service-areas` موجودة + CRUD كامل، لكن لا توجد واجهة لتعيين سائقين لمناطق
- **المطلوب:** إضافة واجهة لتعيين/إزالة سائقين من مناطق الخدمة

### 5.4 🔴 سجل مراجعة الكوبونات (Coupon Audit)

- **الداتابيز:** جدول `coupon_audit_log` — مصمم لتسجيل كل تغيير على الكوبونات
- **الكود:** لا يتم الكتابة فيه أبداً (0 صفوف)
- **المطلوب:** trigger أو كود لتسجيل التغييرات + واجهة عرض

### 5.5 🔴 تتبع استخدام الكوبونات

- **الداتابيز:** جدول `coupon_usages` — يسجل من استخدم أي كوبون ومتى
- **الكود:** لا يتم الكتابة فيه (0 صفوف)
- **المطلوب:** ربطه بعملية تطبيق الكوبون

### 5.6 🔴 سجل المكافآت المالية

- **الداتابيز:** جدول `driver_bonus_ledger` — سجل تفصيلي لكل مكافأة
- **الكود:** صفحة المكافآت موجودة لكن ledger فارغ
- **المطلوب:** الكتابة في ledger عند إنشاء/صرف مكافأة

### 5.7 ⚠️ Realtime مفعّل لكن غير مستخدم (12 من 13 جدول)

- Realtime مفعّل على: `trips`, `trip_offers`, `driver_locations`, `users`, `notifications`, `complaints`, `support_tickets`, `support_messages`, `coupons`, `withdrawal_requests`, `drivers_profile`, `ratings`, `route_plans`
- **مستخدم فعلياً فقط في:** `driver-locations` (خريطة السائقين)
- **الفائدة المهدرة:** يمكن استخدام Realtime في:
  - تحديث قائمة الرحلات تلقائياً
  - إشعارات الشكاوى الجديدة
  - تحديث حالة طلبات السحب
  - رسائل الدعم الفني المباشرة

---

## 6 — نواقص في الكود

### 6.1 🔴 لا توجد Error Boundaries

- لا يوجد أي ملف `error.tsx` في المشروع
- أي خطأ في Server Component سيظهر كصفحة بيضاء أو خطأ Next.js الافتراضي
- **المطلوب:** إضافة `error.tsx` في:
  - `src/app/error.tsx` (global)
  - `src/app/dashboard/error.tsx` (dashboard-level)

### 6.2 🔴 لا توجد Loading States

- لا يوجد أي ملف `loading.tsx` في المشروع
- التنقل بين الصفحات لا يظهر أي مؤشر تحميل
- **المطلوب:** إضافة `loading.tsx` في:
  - `src/app/dashboard/loading.tsx`
  - وفي كل مجلد صفحة رئيسية

### 6.3 🔴 لا يوجد ملف `not-found.tsx`

- لا توجد صفحة 404 مخصصة
- **المطلوب:** `src/app/not-found.tsx`

### 6.4 🔴 صفر اختبارات (Tests)

- لا يوجد أي ملف `.test.*` أو `.spec.*` في المشروع بالكامل
- لا يوجد إعداد Jest أو Vitest أو Playwright
- **المطلوب:** على الأقل:
  - Unit tests للـ utility functions (`utils.ts`, `formatCurrency`, `formatDate`)
  - Integration tests للـ API routes
  - E2E tests للمسارات الحرجة (login → dashboard)

### 6.5 ⚠️ صفحة Vehicle Types غير موجودة في الداشبورد

- يوجد 4 API routes لـ vehicle-types: `create`, `update`, `delete`, `toggle`
- **لا توجد صفحة dashboard** لإدارة أنواع المركبات
- التعديل يتم من خلال صفحة التسعير فقط
- **المطلوب:** صفحة `/dashboard/vehicle-types` مستقلة أو ضمن الإعدادات

### 6.6 ⚠️ نظام الإشعارات: الكود موجود لكن البيانات فارغة

- صفحة `/dashboard/notifications` مبنية بالكامل ✅
- API route `/api/notifications/send` مبني بالكامل ✅
- **المشكلة:** جدول `notifications` فارغ (0 صفوف) — لا يتم إرسال إشعارات من الموبايل أو الباكند
- **المطلوب:** ربط triggers أو RPC functions لإرسال إشعارات تلقائية عند:
  - إنشاء رحلة جديدة
  - تغيير حالة الرحلة
  - قبول/رفض وثائق السائق
  - استلام شكوى جديدة

### 6.7 ⚠️ `driver_revision_requests` — واجهة موجودة لكن الجدول فارغ

- يوجد مجلد `/dashboard/drivers/revision`
- يوجد API route `/api/drivers/request-revision`
- الجدول فارغ (0 صفوف) — الميزة لم تُستخدم فعلياً

### 6.8 ⚠️ لا يوجد نظام Roles/Permissions متقدم في الداشبورد

- `auth-guard.ts` يفحص `is_admin` أو `role = supervisor/admin`
- لكن لا توجد واجهة لإدارة أدوار المشرفين
- لا يوجد تمييز بين صلاحيات admin و supervisor في الواجهة

---

## 7 — أداء وصيانة

### 7.1 أعمدة مكررة في `trips`

كما ذُكر في القسم 2.3 — `pickup_address` / `origin_address` و `destination_address` / `dest_address` مكررة.

### 7.2 `pg_cron` مفعّل لكن لا نعرف الجدول

- Extension `pg_cron` مفعّلة — تُستخدم لتشغيل مهام مجدولة
- **التوصية:** التحقق من `cron.job` لمعرفة المهام المجدولة:
```sql
SELECT * FROM cron.job;
```

### 7.3 PostGIS Extensions

- `postgis`, `postgis_raster`, `postgis_tiger_geocoder`, `postgis_topology` كلها مفعّلة
- يُستخدم `geography(Point,4326)` في `driver_locations.geom`
- **ملاحظة:** فقط `postgis` الأساسي مستخدم — باقي الـ extensions قد تكون زائدة

### 7.4 عدم وجود Database Migrations مُتتبعة

- لا يوجد مجلد `migrations` أو `supabase/migrations` في المشروع
- التغييرات على الداتابيز غير موثقة وغير قابلة للإعادة
- **التوصية:** استخدام `supabase db diff` لتوليد migrations

---

## 8 — خريطة الميزات: موجود vs ناقص

### الصفحات

| الميزة | DB جاهز | صفحة Dashboard | API Routes | الحالة |
|--------|---------|----------------|------------|--------|
| نظرة عامة (Dashboard) | ✅ | ✅ | — | ✅ مكتمل |
| إدارة المستخدمين | ✅ | ✅ | ✅ block, set-role | ✅ مكتمل |
| تفاصيل المستخدم | ✅ | ✅ `users/[id]` | — | ✅ مكتمل |
| إدارة السائقين | ✅ | ✅ | ✅ verify, revoke, toggle | ✅ مكتمل |
| تفاصيل السائق | ✅ | ✅ `drivers/[id]` | — | ✅ مكتمل |
| مراجعة وثائق السائق | ✅ | ✅ `drivers/revision` | ✅ request-revision | ⚠️ موجود لكن فارغ |
| مواقع السائقين (خريطة) | ✅ | ✅ + Realtime | — | ✅ مكتمل |
| الرحلات | ✅ | ✅ | ✅ cancel, delete | ✅ مكتمل |
| تفاصيل الرحلة | ✅ | ✅ `trips/[id]` | — | ✅ مكتمل |
| خطط المسار | ✅ | ✅ | ✅ | ✅ مكتمل |
| عروض الرحلات | ✅ | ✅ | ✅ cancel | ✅ مكتمل |
| التقييمات | ✅ | ✅ | ✅ delete | ✅ مكتمل |
| الشكاوى | ✅ | ✅ | ✅ resolve | ✅ مكتمل |
| تفاصيل الشكوى | ✅ | ✅ `complaints/[id]` | — | ✅ مكتمل |
| مناطق الخدمة | ✅ | ✅ | ✅ create, toggle, delete | ✅ مكتمل |
| التسعير | ✅ | ✅ | ✅ sync | ✅ مكتمل |
| الكوبونات | ✅ | ✅ | ✅ delete, toggle | ✅ مكتمل |
| كوبونات المستخدمين | ✅ | ✅ | ✅ assign, delete | ✅ مكتمل |
| تحليلات الكوبونات | ✅ | ✅ | — | ✅ مكتمل |
| المحافظ | ✅ | ✅ | ✅ adjust, top-up | ✅ مكتمل |
| طلبات السحب | ✅ | ✅ | ✅ approve, reject | ✅ مكتمل |
| المكافآت | ✅ | ✅ | ✅ create, toggle | ✅ مكتمل |
| الإشعارات | ✅ | ✅ | ✅ send | ⚠️ موجود لكن فارغ |
| الرسائل/الدعم | ✅ | ✅ | ✅ send, conversation, ticket/close | ✅ مكتمل |
| سجلات الإدارة | ✅ | ✅ | — | ✅ مكتمل |
| الإعدادات | ✅ | ✅ | ✅ actions | ✅ مكتمل |
| **أنواع المركبات** | ✅ | ❌ **لا توجد صفحة** | ✅ CRUD كامل | 🔴 ناقص |
| **الرحلات المجدولة** | ✅ | ❌ | ❌ | 🔴 ناقص |
| **نقاط التقابل** | ✅ | ❌ | ❌ | 🔴 ناقص |
| **تعيين سائقين لمناطق** | ✅ | ❌ | ❌ | 🔴 ناقص |
| **سجل مراجعة الكوبونات** | ✅ | ❌ | ❌ | 🔴 ناقص |
| **تتبع استخدام الكوبونات** | ✅ | ❌ | ❌ | 🔴 ناقص |
| **سجل المكافآت المالية** | ✅ | ❌ | ❌ | 🔴 ناقص |
| **تصدير البيانات** | — | — | ✅ `/api/export` | ⚠️ يحتاج تحقق |

### البنية التحتية

| الميزة | الحالة | الأولوية |
|--------|--------|----------|
| Middleware (auth + session refresh) | ❌ غير موجود | 🔴 حرج |
| Error Boundaries (`error.tsx`) | ❌ غير موجود | 🔴 حرج |
| Loading States (`loading.tsx`) | ❌ غير موجود | 🔴 مهم |
| Not Found Page (`not-found.tsx`) | ❌ غير موجود | ⚠️ متوسط |
| `.env.example` | ❌ غير موجود | ⚠️ متوسط |
| Unit/Integration Tests | ❌ صفر | 🔴 مهم |
| Database Migrations | ❌ غير متتبعة | ⚠️ متوسط |
| Realtime في باقي الصفحات | ❌ 12/13 غير مستخدم | ⚠️ تحسين |
| تفعيل إشعارات تلقائية | ❌ | ⚠️ متوسط |

---

## 9 — توصيات ذات أولوية

### 🔴 أولوية حرجة (افعلها الآن)

1. **إنشاء `middleware.ts`** — حماية المسارات + تحديث الجلسة
2. **إضافة `error.tsx`** — في `app/` و `app/dashboard/` على الأقل
3. **إضافة `loading.tsx`** — في `app/dashboard/` على الأقل
4. **إصلاح geohash NULL** — 66.67% من السائقين بدون geohash يكسر `get_nearby_drivers`
5. **VACUUM FULL** على الجداول المتضخمة (خاصة `pricing_config` 87.5%)

### 🟡 أولوية مهمة (خلال أسبوع)

6. **إنشاء صفحة Vehicle Types** — الـ API جاهز، ينقصه الواجهة فقط
7. **تفعيل إشعارات تلقائية** — ربط triggers للجدول الموجود
8. **حذف الأعمدة المكررة** في `trips` (بعد migration آمنة)
9. **إضافة `.env.example`**
10. **إعداد testing framework** (Vitest + Playwright)
11. **ضبط `fillfactor = 70`** لـ `driver_locations`

### 🟢 أولوية تحسين (خلال شهر)

12. **استخدام Realtime** في صفحات الرحلات والشكاوى والسحب
13. **تفعيل `coupon_audit_log`** و `coupon_usages`
14. **بناء واجهة تعيين سائقين لمناطق الخدمة**
15. **تفعيل `driver_bonus_ledger`**
16. **إضافة واجهة الرحلات المجدولة**
17. **توثيق الجداول** (إضافة COMMENT على 21 جدول)
18. **إنشاء `supabase/migrations`** لتتبع التغييرات
19. **مراجعة وتنظيف** PostGIS extensions الزائدة
20. **إضافة نقاط التقابل** في واجهة تفاصيل الرحلة

---

> **ملاحظة:** هذا التحليل مبني على فحص CSV Schema X-Ray + الكود المصدري في `taxi_web`. بعض الملاحظات قد تكون مرتبطة ببيئة التطوير فقط (مثل الجداول الفارغة) وليست مشكلة في بيئة الإنتاج.
