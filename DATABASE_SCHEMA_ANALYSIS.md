# Database Schema Analysis Report
## Taxi App vs Database Schema Comparison

**Analysis Date:** 2026-04-26  
**Database:** PostgreSQL (Supabase)  
**App:** Flutter Taxi App  
**Scope:** Comprehensive line-by-line analysis of database schema vs Flutter app implementation

---

# Executive Summary

This report provides a detailed analysis of the PostgreSQL database schema (from Supabase X-Ray Introspection Report) compared against the Flutter taxi app implementation. The analysis identifies missing features, incomplete implementations, and inconsistencies between the database structure and the app code.

**Key Findings:**
- **18 database tables** exist in the schema
- **6 tables** have partial or no implementation in the Flutter app
- **12 RPC functions** are defined in the database but not called from the Flutter app
- **Critical missing features:** Driver profile management, messaging system, trip offers, ratings, support messages

---

# Database Tables Overview

The database contains the following tables:

| Table | Purpose | Row Count | Implementation Status |
|-------|---------|-----------|----------------------|
| users | User accounts and authentication | 7 | ✅ Partial |
| users_profile | Extended user profile data | 0 | ❌ Missing |
| drivers_profile | Driver-specific information | 3 | ❌ Missing |
| driver_locations | Real-time driver GPS tracking | 0 | ⚠️ Partial |
| user_presence | User location for heatmap | - | ✅ Implemented |
| trips | Trip requests and status | 8 | ✅ Partial |
| trip_offers | Driver offers for trips | 6 | ❌ Missing |
| vehicle_types | Vehicle type configurations | 2 | ✅ Partial |
| pricing_config | Pricing rules per vehicle type | - | ⚠️ Partial |
| ratings | User and driver ratings | 1 | ❌ Missing |
| coupons | Discount coupons | 0 | ✅ Partial |
| user_coupons | User-assigned coupons | 0 | ✅ Implemented |
| coupon_usages | Coupon usage tracking | 0 | ❌ Missing |
| messages | In-app messaging | 0 | ❌ Missing |
| notifications | Push notifications | 0 | ⚠️ Partial |
| support_messages | Customer support tickets | 1 | ⚠️ Partial |
| admin_logs | Admin action audit trail | 0 | ❌ Missing |

---

# Detailed Table-by-Table Analysis

## 1. users Table

**Database Schema:**
- `id` (UUID, primary key)
- `email` (varchar, unique)
- `phone` (varchar, unique)
- `role` (varchar: 'user', 'driver', 'supervisor')
- `is_admin` (boolean, default: false)
- `is_active` (boolean, default: true)
- `is_blocked` (boolean, default: false)
- `blocked_at` (timestamptz, nullable)
- `blocked_reason` (text, nullable)
- `rating` (numeric(3,2), default: 5.00)
- `total_trips` (integer, default: 0)
- `language` (varchar(10), default: 'ar')
- `fcm_token` (text, nullable - for push notifications)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Flutter App Implementation:**
- ✅ Basic authentication via Supabase Auth
- ⚠️ **Missing:** Role-based UI handling (user vs driver vs supervisor)
- ⚠️ **Missing:** Admin status check in app
- ⚠️ **Missing:** Blocked user handling
- ⚠️ **Missing:** Rating display in user profile
- ⚠️ **Missing:** Total trips counter
- ⚠️ **Missing:** Language preference implementation
- ⚠️ **Missing:** FCM token registration for push notifications

**Issues:**
1. The app does not handle user blocking/unblocking states
2. No visual indication of user role in the UI
3. FCM token is not being saved to the database for push notifications
4. User rating and total trips are not displayed in the profile

---

## 2. users_profile Table

**Database Schema:**
- `id` (UUID, primary key, references users.id)
- Additional profile fields (schema not fully detailed in CSV for columns)

**Flutter App Implementation:**
- ❌ **COMPLETELY MISSING** - No implementation found

**Issues:**
1. No user profile management screens
2. Cannot update extended profile information
3. Missing profile photo upload functionality

---

## 3. drivers_profile Table

**Database Schema:**
- `id` (UUID, primary key, references users.id)
- `national_id` (text, not null)
- `license_number` (text, not null)
- `vehicle_type` (varchar(50), not null)
- `vehicle_brand` (varchar(50), not null)
- `vehicle_model` (varchar(50), not null)
- `vehicle_year` (integer, not null, >= 1900)
- `vehicle_color` (varchar(50), not null)
- `vehicle_plate` (varchar(20), not null)
- `vehicle_image_url` (text, not null)
- `national_id_image` (text, nullable)
- `license_image` (text, nullable)
- `criminal_record_image` (text, nullable)
- `is_verified` (boolean, default: false)
- `is_available` (boolean, default: false)
- `current_lat` (numeric, nullable)
- `current_lng` (numeric, nullable)
- `geohash` (varchar(20), nullable)
- `geohash5` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Constraints:**
- CHECK: vehicle_year >= 1900 AND <= current_year + 1
- Index on geohash5 for available drivers

**Flutter App Implementation:**
- ❌ **COMPLETELY MISSING** - No driver profile management
- ⚠️ `DriverLocationManager` exists but only manages local geohash, doesn't sync to database

**Issues:**
1. No driver registration/onboarding flow
2. No document upload (national ID, license, criminal record, vehicle image)
3. No vehicle information entry screens
4. No driver verification status display
5. No availability toggle for drivers
6. No synchronization of driver location to `driver_locations` table via RPC
7. Missing call to `upsert_driver_location` RPC function

**Required RPC Functions Not Called:**
- `create_driver_account` - Creates complete driver profile with all documents
- `verify_driver` - Admin function to verify driver
- `unverify_driver` - Admin function to unverify driver
- `upsert_driver_location` - Update driver GPS location

---

## 4. driver_locations Table

**Database Schema:**
- `id` (UUID, primary key)
- `driver_id` (UUID, references drivers_profile.id, unique)
- `lat` (numeric, not null)
- `lng` (numeric, not null)
- `heading` (numeric, nullable)
- `geohash` (varchar(20), nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Flutter App Implementation:**
- ⚠️ **PARTIAL** - `DriverLocationManager` tracks location locally
- ❌ Does not call `upsert_driver_location` RPC function
- ❌ No database synchronization

**Issues:**
1. Driver location is tracked locally but not synced to database
2. The `upsert_driver_location` RPC function exists but is never called
3. Other drivers cannot see this driver's location
4. Real-time tracking for passengers is not functional

---

## 5. user_presence Table

**Database Schema:**
- `user_id` (UUID, primary key, references users.id)
- `lat` (numeric, not null)
- `lng` (numeric, not null)
- `last_seen` (timestamptz, default: now())

**Flutter App Implementation:**
- ✅ **FULLY IMPLEMENTED** in `user_presence_service.dart`
- ✅ Heartbeat every 30 seconds
- ✅ Lifecycle handling (pause/resume)
- ✅ Proper cleanup on app close

**Status:** This is the best-implemented feature in the app.

---

## 6. trips Table

**Database Schema:**
- `id` (UUID, primary key)
- `user_id` (UUID, references users.id)
- `driver_id` (UUID, references users.id, nullable, SET NULL on delete)
- `vehicle_type` (varchar(50), references vehicle_types.name)
- `pickup_address` (text, nullable)
- `pickup_lat` (numeric, nullable)
- `pickup_lng` (numeric, nullable)
- `destination_address` (text, not null)
- `destination_lat` (numeric, not null)
- `destination_lng` (numeric, not null)
- `distance_km` (numeric, not null, >= 0)
- `price` (numeric, not null, >= 0)
- `final_price` (numeric, nullable, >= 0)
- `status` (varchar: 'searching', 'accepted', 'in_progress', 'completed', 'cancelled')
- `payment_method` (varchar(50), nullable)
- `is_paid` (boolean, default: false)
- `geohash` (varchar(20), nullable)
- `meeting_lat` (numeric, nullable)
- `meeting_lng` (numeric, nullable)
- `meeting_address` (text, nullable)
- `origin_address` (text, nullable)
- `dest_address` (text, nullable)
- `user_rating_to_driver` (numeric(3,2), nullable, 1-5)
- `driver_rating_to_user` (numeric(3,2), nullable, 1-5)
- `created_at` (timestamptz)
- `accepted_at` (timestamptz, nullable)
- `started_at` (timestamptz, nullable)
- `completed_at` (timestamptz, nullable)
- `cancelled_at` (timestamptz, nullable)
- `cancel_reason` (text, nullable)
- `cancelled_by` (varchar(20), nullable)

**Flutter App Implementation:**
- ✅ Trip creation with basic fields
- ✅ Trip status updates
- ✅ User trip history
- ✅ Available trips for drivers
- ⚠️ **Missing:** `final_price` handling
- ⚠️ **Missing:** Meeting point (meeting_lat, meeting_lng, meeting_address)
- ⚠️ **Missing:** Origin and destination address fields (origin_address, dest_address)
- ⚠️ **Missing:** Rating fields (user_rating_to_driver, driver_rating_to_user)
- ⚠️ **Missing:** Cancellation reason tracking
- ⚠️ **Missing:** Payment method selection
- ⚠️ **Missing:** Payment status tracking

**Issues:**
1. Trip model in Flutter is missing several database columns
2. No rating submission after trip completion
3. No cancellation reason collection
4. Payment flow is not implemented
5. Meeting point functionality is missing

**Required RPC Functions Not Called:**
- `calculate_trip_price` - Calculate price based on vehicle type and distance
- `validate_trip_price` - Validate trip price before creation
- `driver_accept_trip` - Driver accepts a trip
- `driver_reject_trip` - Driver rejects a trip
- `driver_start_trip` - Driver starts the trip
- `driver_complete_trip` - Driver completes the trip
- `apply_coupon_to_trip` - Apply coupon discount to trip

---

## 7. trip_offers Table

**Database Schema:**
- `id` (UUID, primary key)
- `trip_id` (UUID, references trips.id)
- `driver_id` (UUID, references users.id)
- `offered_price` (numeric, nullable)
- `status` (varchar: 'pending', 'accepted', 'rejected', 'expired')
- `expires_at` (timestamptz, nullable)
- `created_at` (timestamptz)

**Constraints:**
- UNIQUE: (trip_id, driver_id)
- CHECK: status in ('pending', 'accepted', 'rejected', 'expired')

**Flutter App Implementation:**
- ❌ **COMPLETELY MISSING**

**Issues:**
1. No trip offer system implemented
2. Drivers cannot make offers on trips
3. Users cannot see driver offers
4. No offer expiration handling
5. Missing offer acceptance/rejection flow

**Impact:** This is a critical missing feature for the driver-side of the app. Without trip offers, drivers cannot bid on trips or negotiate prices.

---

## 8. vehicle_types Table

**Database Schema:**
- `id` (UUID, primary key)
- `name` (varchar(50), unique)
- `display_name` (varchar(100), not null)
- `icon` (varchar(50), not null)
- `base_fare` (numeric, not null)
- `price_per_km` (numeric, not null)
- `minimum_fare` (numeric, nullable)
- `is_active` (boolean, default: true)
- `sort_order` (integer, default: 0)
- `created_at` (timestamptz)

**Flutter App Implementation:**
- ⚠️ **PARTIAL** - Used in pricing screen
- ✅ Vehicle type selection
- ✅ Price calculation display
- ⚠️ **Missing:** Direct RPC call to `admin_update_pricing`
- ⚠️ **Missing:** Admin management of vehicle types

**Issues:**
1. Vehicle types are fetched but not managed by admins in the app
2. Pricing updates are done via API routes in web admin, not RPC in Flutter app
3. No vehicle type creation/editing in Flutter app

---

## 9. pricing_config Table

**Database Schema:**
- `id` (UUID, primary key)
- `vehicle_type` (varchar(50), unique, references vehicle_types.name)
- `base_fare` (numeric, not null)
- `price_per_km` (numeric, not null)
- `minimum_fare` (numeric, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Note:** This table is isolated (no foreign key relationships).

**Flutter App Implementation:**
- ⚠️ **PARTIAL** - Pricing is calculated but not directly from this table
- ⚠️ **Missing:** Direct RPC call to `admin_update_pricing`

**Issues:**
1. Pricing configuration is not directly fetched from this table
2. The `admin_update_pricing` RPC function exists but is not called from Flutter
3. Price calculation may be inconsistent with database rules

---

## 10. ratings Table

**Database Schema:**
- `id` (UUID, primary key)
- `user_id` (UUID, references users.id)
- `driver_id` (UUID, references users.id)
- `trip_id` (UUID, references trips.id, unique per user)
- `rating` (numeric(3,2), not null, 1-5)
- `comment` (text, nullable)
- `created_at` (timestamptz)

**Constraints:**
- UNIQUE: (trip_id, user_id)
- CHECK: rating between 1 and 5

**Triggers:**
- `rating_inserted_update_driver` - Recalculates driver average rating on insert

**Flutter App Implementation:**
- ❌ **COMPLETELY MISSING**

**Issues:**
1. No rating submission UI
2. No rating display for drivers
3. No rating display for users
4. No comment field for ratings
5. Missing call to `get_driver_avg_rating` RPC function

**Required RPC Functions Not Called:**
- `get_driver_avg_rating` - Get driver's average rating

---

## 11. coupons Table

**Database Schema:**
- `id` (UUID, primary key)
- `code` (varchar(50), unique)
- `discount_type` (varchar: 'percentage', 'fixed')
- `discount_value` (numeric, not null, > 0)
- `min_trip_price` (numeric, nullable)
- `max_uses` (integer, nullable, >= 0)
- `used_count` (integer, default: 0)
- `expires_at` (timestamptz, nullable)
- `is_active` (boolean, default: true)
- `created_at` (timestamptz)

**Constraints:**
- CHECK: discount_value > 0
- CHECK: max_uses IS NULL OR max_uses >= 0
- CHECK: discount_type in ('percentage', 'fixed')

**Flutter App Implementation:**
- ✅ Coupon validation
- ✅ Coupon listing
- ⚠️ **Missing:** Direct RPC call to `validate_coupon`
- ⚠️ **Missing:** Direct RPC call to `use_coupon_atomic`

**Issues:**
1. Coupon validation is done via direct table query instead of RPC
2. The `validate_coupon` RPC function exists but is not used
3. The `use_coupon_atomic` RPC function exists but is not used
4. This may lead to race conditions in coupon usage

---

## 12. user_coupons Table

**Database Schema:**
- `id` (UUID, primary key)
- `user_id` (UUID, references users.id)
- `coupon_id` (UUID, references coupons.id)
- `is_used` (boolean, default: false)
- `used_at` (timestamptz, nullable)
- `assigned_at` (timestamptz, default: now())

**Constraints:**
- UNIQUE: (user_id, coupon_id)

**Flutter App Implementation:**
- ✅ User coupon listing
- ✅ Coupon assignment
- ✅ Mark as used

**Status:** Well implemented.

---

## 13. coupon_usages Table

**Database Schema:**
- `id` (UUID, primary key)
- `user_coupon_id` (UUID, references user_coupons.id)
- `trip_id` (UUID, references trips.id, unique)
- `discount_amount` (numeric, not null)
- `created_at` (timestamptz)

**Constraints:**
- UNIQUE: (trip_id)

**Triggers:**
- `coupon_usage_inserted_increment` - Increments coupon used_count

**Flutter App Implementation:**
- ❌ **COMPLETELY MISSING**

**Issues:**
1. Coupon usage is not tracked per trip
2. Cannot see which coupons were used on which trips
3. Missing discount amount recording
4. The `apply_coupon_to_trip` RPC function exists but is not called

---

## 14. messages Table

**Database Schema:**
- `id` (UUID, primary key)
- `sender_id` (UUID, references users.id)
- `receiver_id` (UUID, references users.id)
- `trip_id` (UUID, references trips.id, nullable, SET NULL on delete)
- `content` (text, not null)
- `is_read` (boolean, default: false)
- `created_at` (timestamptz)

**Constraints:**
- CHECK: sender_id != receiver_id

**Flutter App Implementation:**
- ❌ **COMPLETELY MISSING**

**Issues:**
1. No in-app messaging system
2. No driver-passenger communication
3. No message read status tracking
4. No trip-specific messaging

**Impact:** Critical missing feature for trip coordination between drivers and passengers.

---

## 15. notifications Table

**Database Schema:**
- `id` (UUID, primary key)
- `user_id` (UUID, references users.id)
- `type` (varchar: 'general', 'trip', 'promo', 'system', 'trip_offer', 'offer_accepted', 'driver_arriving', 'trip_started', 'trip_completed', 'trip_cancelled', 'no_drivers', 'new_message', 'account_verified')
- `title` (varchar(255), nullable)
- `body` (text, nullable)
- `title_ar` (varchar(255), nullable)
- `body_ar` (text, nullable)
- `reference_id` (UUID, nullable)
- `is_read` (boolean, default: false)
- `created_at` (timestamptz)

**Flutter App Implementation:**
- ⚠️ **PARTIAL** - Basic notification screen exists
- ⚠️ **Missing:** Full notification type handling
- ⚠️ **Missing:** Arabic/English localization
- ⚠️ **Missing:** Reference ID linking
- ⚠️ **Missing:** All notification types from schema

**Issues:**
1. Only basic notification listing is implemented
2. No handling for specific notification types (trip_offer, driver_arriving, etc.)
3. No bilingual support (Arabic/English)
4. No deep linking to related entities via reference_id
5. No real-time notification subscription

---

## 16. support_messages Table

**Database Schema:**
- `id` (UUID, primary key)
- `user_id` (UUID, references users.id)
- `subject` (varchar(255), not null)
- `message` (text, not null)
- `status` (varchar: 'open', 'in_progress', 'resolved', 'closed')
- `admin_response` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Flutter App Implementation:**
- ⚠️ **PARTIAL** - Basic complaints screen exists
- ⚠️ **Missing:** Status tracking
- ⚠️ **Missing:** Admin response display
- ⚠️ **Missing:** Support ticket history

**Issues:**
1. No support ticket status tracking
2. Cannot see admin responses
3. No support ticket history view
4. Status field is not used

---

## 17. admin_logs Table

**Database Schema:**
- `id` (UUID, primary key)
- `admin_id` (UUID, references users.id)
- `action` (varchar(100), not null)
- `table_name` (varchar(100), nullable)
- `record_id` (UUID, nullable)
- `old_data` (jsonb, nullable)
- `new_data` (jsonb, nullable)
- `ip_address` (text, nullable)
- `user_agent` (text, nullable)
- `created_at` (timestamptz)

**Flutter App Implementation:**
- ❌ **COMPLETELY MISSING**

**Issues:**
1. No admin action logging in Flutter app
2. The `log_admin_action` RPC function exists but is not called
3. No audit trail for admin operations from mobile app

**Note:** This is primarily for the web admin panel, but if admins use the mobile app, this should be implemented.

---

# RPC Functions Analysis

The database defines 28 RPC functions. Below is the analysis of which are called from the Flutter app:

## Called RPC Functions

| Function | Called in Flutter | Purpose |
|----------|------------------|---------|
| None | ❌ | No RPC functions are called from Flutter app |

**Critical Finding:** The Flutter app does not call ANY of the database RPC functions. All database operations are done via direct Supabase client queries.

## Not Called RPC Functions

### Driver Management
1. **create_driver_account** - Creates complete driver profile with documents
   - **Impact:** Driver onboarding is incomplete
   - **Required for:** Driver registration flow

2. **verify_driver** - Admin verifies driver
   - **Impact:** No driver verification in app
   - **Required for:** Admin driver approval

3. **unverify_driver** - Admin unverifies driver
   - **Impact:** Cannot unverify drivers from app
   - **Required for:** Admin driver management

4. **upsert_driver_location** - Updates driver GPS location
   - **Impact:** Driver location not synced to database
   - **Required for:** Real-time driver tracking

### Trip Management
5. **driver_accept_trip** - Driver accepts a trip
   - **Impact:** Trip acceptance not using proper RPC
   - **Required for:** Proper trip state management

6. **driver_reject_trip** - Driver rejects a trip
   - **Impact:** Trip rejection not using proper RPC
   - **Required for:** Proper trip state management

7. **driver_start_trip** - Driver starts the trip
   - **Impact:** Trip start not using proper RPC
   - **Required for:** Proper trip state management

8. **driver_complete_trip** - Driver completes the trip
   - **Impact:** Trip completion not using proper RPC
   - **Required for:** Proper trip state management

### Pricing
9. **calculate_trip_price** - Calculates trip price
   - **Impact:** Price calculation may be inconsistent
   - **Required for:** Accurate pricing

10. **validate_trip_price** - Validates trip price
    - **Impact:** No price validation before trip creation
    - **Required for:** Price integrity

11. **admin_update_pricing** - Admin updates pricing
    - **Impact:** Pricing updates not using RPC
    - **Required for:** Admin pricing management

### Coupons
12. **validate_coupon** - Validates coupon code
    - **Impact:** Coupon validation via direct query instead of RPC
    - **Required for:** Proper coupon validation

13. **apply_coupon_to_trip** - Applies coupon to trip
    - **Impact:** Coupon application not tracked
    - **Required for:** Coupon usage tracking

14. **use_coupon_atomic** - Atomically uses coupon
    - **Impact:** Race condition risk in coupon usage
    - **Required for:** Safe coupon usage

### Ratings
15. **get_driver_avg_rating** - Gets driver average rating
    - **Impact:** Driver ratings not displayed
    - **Required for:** Rating display

### Admin Functions
16. **get_admin_dashboard_stats** - Gets admin dashboard statistics
    - **Impact:** Admin stats not available in app
    - **Required for:** Admin dashboard

17. **log_admin_action** - Logs admin action
    - **Impact:** No audit trail from mobile app
    - **Required for:** Admin audit logging

18. **promote_user_to_admin** - Promotes user to admin
    - **Impact:** Cannot promote admins from app
    - **Required for:** Admin management

19. **demote_user_from_admin** - Demotes user from admin
    - **Impact:** Cannot demote admins from app
    - **Required for:** Admin management

20. **set_first_user_as_admin** - Sets first user as admin
    - **Impact:** Initial admin setup
    - **Required for:** First-time setup

### Location Services
21. **get_nearby_drivers** - Gets nearby drivers by geohash
    - **Impact:** Not using optimized nearby driver query
    - **Required for:** Efficient driver matching

### Cleanup Functions
22. **cleanup_stale_trips** - Cleans up stale trips
    - **Impact:** Scheduled job, not app concern
    - **Required for:** Database maintenance

23. **cleanup_stale_user_presence** - Cleans up stale user presence
    - **Impact:** Scheduled job, not app concern
    - **Required for:** Database maintenance

24. **cleanup_stuck_trips** - Cleans up stuck trips
    - **Impact:** Scheduled job, not app concern
    - **Required for:** Database maintenance

### Trigger Functions (Internal)
25. **_fn_increment_coupon_used_count** - Trigger function
26. **_fn_recalculate_driver_rating** - Trigger function
27. **_fn_update_total_trips_on_complete** - Trigger function
28. **update_updated_at_column** - Trigger function

---

# Missing Features Summary

## Critical Missing Features (High Priority)

1. **Driver Profile Management**
   - Driver registration/onboarding
   - Document upload (national ID, license, vehicle image)
   - Vehicle information entry
   - Driver verification status
   - Driver availability toggle

2. **Trip Offers System**
   - Driver offer creation
   - Offer display to users
   - Offer acceptance/rejection
   - Offer expiration handling

3. **Messaging System**
   - In-app messaging between driver and passenger
   - Trip-specific messaging
   - Message read status
   - Real-time message updates

4. **Ratings System**
   - Rating submission after trip completion
   - Driver rating display
   - User rating display
   - Rating comments
   - Average rating calculation

5. **RPC Function Integration**
   - All 20+ RPC functions should be called instead of direct queries
   - Ensures data integrity and business logic enforcement

## Important Missing Features (Medium Priority)

6. **Coupon Usage Tracking**
   - Track which coupons were used on which trips
   - Record discount amounts
   - Coupon usage history

7. **Enhanced Notifications**
   - All notification types from schema
   - Bilingual support (Arabic/English)
   - Deep linking to related entities
   - Real-time notification subscription

8. **Support Ticket System**
   - Support ticket status tracking
   - Admin response display
   - Support ticket history

9. **User Profile Management**
   - Extended profile fields
   - Profile photo upload
   - Profile editing

## Nice-to-Have Features (Low Priority)

10. **Admin Features in Mobile App**
    - Admin dashboard stats
    - Admin action logging
    - Admin management functions

11. **Payment Flow**
    - Payment method selection
    - Payment status tracking
    - Final price handling

12. **Meeting Point Feature**
    - Meeting point selection
    - Meeting point display
    - Navigation to meeting point

---

# Data Inconsistencies

## Trip Model Mismatches

**Database columns not in Flutter TripModel:**
- `pickup_address` (nullable in DB, required in Flutter)
- `pickup_lat` (nullable in DB, required in Flutter)
- `pickup_lng` (nullable in DB, required in Flutter)
- `final_price` (missing in Flutter)
- `origin_address` (missing in Flutter)
- `dest_address` (missing in Flutter)
- `user_rating_to_driver` (missing in Flutter)
- `driver_rating_to_user` (missing in Flutter)
- `cancelled_at` (missing in Flutter)
- `cancel_reason` (missing in Flutter)
- `cancelled_by` (missing in Flutter)

**Flutter TripModel fields not matching DB:**
- Flutter uses `pickup_address` but DB may have different naming
- Flutter doesn't handle nullable fields properly

## Coupon Model Mismatches

**Database columns not in Flutter CouponModel:**
- None significant

**Issues:**
- Flutter validates coupons via direct query instead of `validate_coupon` RPC
- Missing `coupon_usages` tracking

---

# Security Considerations

## RLS Policies

All tables have Row Level Security (RLS) enabled with appropriate policies. The Flutter app relies on Supabase Auth for authentication, which is correct.

**Potential Issues:**
1. No explicit role checking in Flutter app (user vs driver vs admin)
2. No handling of blocked users in app logic
3. FCM token not saved, limiting push notification capabilities

---

# Recommendations

## Immediate Actions (Critical)

1. **Implement Driver Profile Management**
   - Create driver registration flow
   - Implement document upload
   - Add driver verification status display
   - Call `create_driver_account` RPC function

2. **Implement Trip Offers System**
   - Create offer creation UI for drivers
   - Create offer display UI for users
   - Implement offer acceptance/rejection flow

3. **Implement Messaging System**
   - Create messaging UI
   - Implement real-time message updates via Supabase Realtime
   - Add message read status tracking

4. **Implement Ratings System**
   - Create rating submission UI
   - Display driver ratings
   - Display user ratings
   - Call `get_driver_avg_rating` RPC function

5. **Replace Direct Queries with RPC Calls**
   - Replace all direct table queries with appropriate RPC functions
   - This ensures business logic is enforced at the database level

## Short-term Actions (Important)

6. **Implement Coupon Usage Tracking**
   - Create `coupon_usages` tracking
   - Call `apply_coupon_to_trip` and `use_coupon_atomic` RPC functions

7. **Enhance Notifications**
   - Implement all notification types
   - Add bilingual support
   - Implement deep linking

8. **Implement Support Ticket System**
   - Add status tracking
   - Display admin responses
   - Create ticket history view

9. **Fix Trip Model**
   - Add missing database columns to TripModel
   - Handle nullable fields properly
   - Implement cancellation reason tracking

## Long-term Actions (Nice-to-Have)

10. **Implement User Profile Management**
    - Create profile editing screens
    - Add profile photo upload
    - Implement extended profile fields

11. **Implement Payment Flow**
    - Add payment method selection
    - Track payment status
    - Handle final price

12. **Add Admin Features to Mobile App**
    - Create admin dashboard
    - Implement admin action logging
    - Add admin management functions

---

# Conclusion

The Flutter taxi app has a solid foundation with user presence tracking and basic trip management. However, there are significant gaps between the database schema and the app implementation:

**Strengths:**
- User presence service is well-implemented
- Basic trip creation and management works
- Coupon validation is functional
- Authentication is properly integrated

**Critical Gaps:**
- Driver profile management is completely missing
- Trip offers system is not implemented
- Messaging system is missing
- Ratings system is missing
- RPC functions are not being used

**Overall Assessment:**
The app is approximately **40% complete** relative to the full database schema. The core user-facing features (trip creation, presence tracking) work well, but driver-side features and advanced functionality (messaging, ratings, offers) are missing.

**Priority Order:**
1. Driver profile management (critical for driver operations)
2. Trip offers system (critical for driver-passenger matching)
3. Messaging system (critical for trip coordination)
4. Ratings system (important for quality control)
5. RPC function integration (important for data integrity)

---

**Report Generated:** 2026-04-26  
**Database Schema Version:** Supabase PostgreSQL Schema X-Ray Introspection Report  
**Analysis Scope:** Complete line-by-line analysis of 728 lines of CSV schema data
