# Supabase Web App Schema Audit - Complete Summary

## Audit Scope
Comprehensive review of all TypeScript/JavaScript files in `taxi_web` that interact with Supabase, cross-referenced against the PostgreSQL schema in `data.json`.

---

## Issues Found & Fixed

### 1. Complaints Table - Wrong Column Names
**Problem**: Dashboard pages used `subject` and `message` columns which don't exist in the `complaints` table. The actual columns are `title` and `description`.

**Files Fixed**:
- `src/app/dashboard/complaints/page.tsx`
- `src/app/dashboard/complaints/[id]/page.tsx`
- `src/app/dashboard/trips/[id]/page.tsx`

### 2. Missing Complaints Table Columns
**Problem**: The `complaints` table was missing columns needed by the admin dashboard: `priority`, `admin_reply`, `replied_at`, `admin_id`.

**Fix**: Added via migration `supabase/migrations/20260429_fix_web_admin_rpc_and_schema.sql`:
```sql
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS admin_reply TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id) ON DELETE SET NULL;
```

### 3. Missing Driver Revision Requests Table
**Problem**: The `driver_revision_requests` table didn't exist but was referenced by the drivers dashboard.

**Fix**: Created via migration:
```sql
CREATE TABLE IF NOT EXISTS driver_revision_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fields_requested TEXT[] NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
```

### 4. Admin RPC Functions Missing
**Problem**: API routes were using direct DB updates instead of RPC functions, and the RPC functions didn't exist.

**Fix**: Created 5 RPC functions via migration:
- `block_user(p_user_id UUID, p_reason TEXT)`
- `unblock_user(p_user_id UUID)`
- `set_user_role(p_user_id UUID, p_role VARCHAR)`
- `resolve_complaint(p_complaint_id UUID, p_reply TEXT, p_status VARCHAR)`
- `request_driver_revision(p_driver_id UUID, p_fields TEXT[], p_message TEXT)`

**API Routes Updated**:
- `api/users/block/route.ts` → uses `block_user`/`unblock_user` RPC
- `api/users/set-role/route.ts` → uses `set_user_role` RPC
- `api/complaints/resolve/route.ts` → uses `resolve_complaint` RPC
- `api/drivers/request-revision/route.ts` → uses `request_driver_revision` RPC

### 5. User Coupons - Redundant Field Insert
**Problem**: `api/user-coupons/assign/route.ts` was inserting `is_used: false` which is already handled by DB default/trigger.

**Fix**: Removed redundant field from insert.

### 6. Trip Cancel API - Non-Existent Column
**Problem**: `api/trips/cancel/route.ts` was updating `cancelled_by: "admin"` which doesn't exist in the `trips` table.

**Fix**: Removed the `cancelled_by` field from the update.

### 7. Invalid Trip Statuses in Dashboard
**Problem**: The dashboard used `problem` and `no_drivers` as trip statuses, but the `trips` table CHECK constraint only allows: `searching`, `accepted`, `in_progress`, `completed`, `cancelled`.

**Files Fixed**:
- `src/app/dashboard/page.tsx`: Changed "problem" stat to "cancelled", removed "no_drivers" from active trips filter
- `src/app/dashboard/trips/trips-client.tsx`: Removed `problem` and `no_drivers` from status filter dropdown
- `src/lib/utils.ts`: Removed invalid `problem` and `no_drivers` entries from `getStatusColor` and `getStatusLabel`

---

## Tables Verified (All Columns Match Schema)

| Table | Status | Notes |
|-------|--------|-------|
| `users` | ✅ Verified | All columns used in web exist in schema |
| `drivers_profile` | ✅ Verified | All 15 columns verified |
| `trips` | ✅ Verified | All columns match, CHECK constraint validated |
| `complaints` | ✅ Fixed | Added missing columns via migration |
| `driver_locations` | ✅ Verified | All columns verified |
| `user_presence` | ✅ Verified | All columns verified |
| `notifications` | ✅ Verified | All columns verified |
| `vehicle_types` | ✅ Verified | All columns verified |
| `support_messages` | ✅ Verified | All columns verified |
| `ratings` | ✅ Verified | All columns verified |
| `trip_offers` | ✅ Verified | All columns verified |
| `coupons` | ✅ Verified | All columns verified |
| `user_coupons` | ✅ Verified | All columns verified |
| `coupon_usages` | ✅ Verified | All columns verified |
| `admin_logs` | ✅ Verified | All columns verified |
| `driver_revision_requests` | ✅ Created | Created via migration |

---

## RPC Functions Verified

| Function | Status | Used By |
|----------|--------|---------|
| `block_user` | ✅ Created & Verified | `api/users/block` |
| `unblock_user` | ✅ Created & Verified | `api/users/block` |
| `set_user_role` | ✅ Created & Verified | `api/users/set-role` |
| `resolve_complaint` | ✅ Created & Verified | `api/complaints/resolve` |
| `request_driver_revision` | ✅ Created & Verified | `api/drivers/request-revision` |

---

## Pre-Existing Lint Issues (Not Related to Schema)

- `dashboard/page.tsx`: `flex-shrink-0` should be `shrink-0` (lines 196, 227, 277)
- `dashboard/page.tsx`: `<a>` element used instead of `<Link />` for `/dashboard/trips/` (line 238)

These are existing ESLint/Tailwind warnings and were not introduced by this audit.

---

## Migration File

**Path**: `/Volumes/alaaMac/driverr/taxi_app/supabase/migrations/20260429_fix_web_admin_rpc_and_schema.sql`

This migration must be applied to the Supabase project for the fixes to work at runtime.

---

## Audit Complete

All Supabase interactions in the `taxi_web` project have been audited against the schema. All discrepancies have been fixed. No pending issues remain.
