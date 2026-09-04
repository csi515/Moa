# Phase 3 Implementation Notes: Guardian-Child Enrollment

## Overview
Implemented Phase 3 of MOA Multi-Role Architecture focusing on guardian-initiated enrollment request workflow. Guardians can now pre-register children globally, search for organizations, request enrollment with consent, and owners can review/approve requests.

## Database Changes (Migrations)

### 1. `20260904140000_guardian_enrollment_requests.sql`
**New tables:**
- `core.guardian_enrollment_requests` - Tracks enrollment requests with status (pending/approved/rejected/cancelled)
  - Links parent_id, student_id, organization_id
  - Includes consent_fields (JSONB), notes, rejection_reason
  - Reviewed_by and reviewed_at for audit trail

**New types:**
- `enrollment_request_status` ENUM

**New RPC functions:**
- `search_organizations_for_enrollment(query, limit)` - Public discovery of orgs
- `find_organization_by_public_code(code)` - Find org by public code
- `request_guardian_enrollment(student_id, org_id, consent_fields, notes)` - Guardian requests enrollment
- `approve_guardian_enrollment(request_id)` - Owner approves, creates customer + enrollment
- `reject_guardian_enrollment(request_id, reason)` - Owner rejects with reason
- `cancel_guardian_enrollment_request(request_id)` - Guardian cancels pending request
- `get_my_enrollment_requests()` - List guardian's requests
- `get_org_enrollment_requests(org_id, status)` - List org's requests for review

**RLS policies:**
- Guardians can see their own requests
- Org admins can see/update requests for their org
- Proper isolation between guardians and orgs

### 2. `20260904141000_update_parent_portal_tree_with_requests.sql`
Updated `get_my_parent_portal_tree()` to include `enrollment_requests` array in response.

## Frontend Implementation

### New Services
**`src/core/parent/services/enrollmentRequestService.ts`**
- Type-safe wrappers for all enrollment request RPCs
- Handles organization search, enrollment requests, approval/rejection
- Uses type assertions for RPCs not yet in generated types

### New UI Components

#### Guardian Flow
1. **`ParentRequestEnrollmentModal.tsx`** - Search orgs by name/location or find by code
2. **`ParentChildSelectorModal.tsx`** - Select which child to enroll
3. **`ParentEnrollmentConsentModal.tsx`** - Consent screen showing what data will be shared
4. **`ParentChildrenHome.tsx`** (updated) - Added "학원 등록 요청" button and request status cards

#### Owner/Admin Flow
1. **`GuardianEnrollmentRequestsView.tsx`** - Review pending/approved/rejected requests
   - Filter by status
   - View guardian and child details
   - Approve or reject with reason
   - Shows contact info, request date, notes

### Integration Points

**Added to modules:**
- Daycare (`DaycareAppContent.tsx`)
- Gym (`GymAppContent.tsx`)  
- Piano (`PianoAppContent.tsx`)

**Navigation:**
- Added `enrollment-requests` tab to all module nav configs
- Icon: UserPlus
- Korean labels: "학부모 등록 요청" (daycare), "회원 등록 요청" (gym)

**Types:**
- Added `enrollment-requests` to `NavTab` type in `AppContext.tsx`
- Updated `ParentPortalTree` to include `enrollmentRequests` field

## Key Design Decisions

### 1. Global Child Management
- Children registered globally under `core.students` before org enrollment
- Parent-child relationship tracked in `core.parent_student_guardians`
- No org reference until enrollment approved

### 2. Two-Step Enrollment
- **Step 1:** Guardian registers child (name, birth date, relationship)
- **Step 2:** Guardian searches org → requests enrollment → owner approves
- Only on approval: customer record created + enrollment record + parent_student_links

### 3. Data Consent
- Explicit consent modal before sending request
- Guardian selects which fields to share (name, birth date)
- Consent stored in `core.academy_data_sharing_consents`

### 4. Historical Preservation
- Enrollment status uses `active`, `leave`, `withdrawn`, `alumni`
- Leaving org changes status to `leave`/`withdrawn`, never deletes
- Historical attendance/consult/payment preserved

### 5. Existing Features Preserved
- Phase 1 multi-role switching intact
- Phase 2 guardian link token (code/QR) flow works
- Legacy `parent_student_links` bridge maintained
- `SupabaseRoleSync` and `ParentShell` unchanged

## Testing Recommendations

### Unit/Integration Tests
While no automated tests were added (per project conventions), the following should be tested:

1. **Guardian Flow:**
   - Register child globally
   - Search organization
   - Find org by public code
   - Request enrollment with consent
   - Cancel pending request

2. **Owner Flow:**
   - View pending requests
   - Approve request (verify customer + enrollment created)
   - Reject request with reason
   - Filter by status

3. **Data Integrity:**
   - Verify RLS policies (guardians can't see other guardians' requests)
   - Verify enrollment creates proper customer/enrollment/parent_student_links
   - Verify historical data preserved on status change

### Manual Testing Steps
1. **As Guardian:**
   ```
   1. Sign up as parent
   2. Add child (name + birth date)
   3. Click "학원 등록 요청"
   4. Search for org or enter public code
   5. Select child
   6. Review consent screen
   7. Submit request
   8. Verify request appears in status section
   ```

2. **As Owner:**
   ```
   1. Navigate to "학부모 등록 요청" tab
   2. Review pending request details
   3. Approve request
   4. Verify child appears in students list
   5. Verify guardian can access child's academy portal
   ```

3. **Edge Cases:**
   - Guardian cancels before approval
   - Owner rejects with reason
   - Duplicate enrollment requests (should be blocked)
   - Child already enrolled (should be blocked)

## Migration Instructions for Production

### Required Steps:
1. **Apply migrations in order:**
   ```bash
   # Apply to production database
   supabase migration up
   ```

2. **Verify RPCs created:**
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'core'
   AND routine_name LIKE '%enrollment%';
   ```

3. **Verify RLS policies:**
   ```sql
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename = 'guardian_enrollment_requests';
   ```

4. **Test in staging:**
   - Create test guardian account
   - Register child
   - Request enrollment
   - Approve as owner
   - Verify end-to-end flow

### Rollback Plan:
```sql
-- If needed, remove new tables/functions
DROP TABLE IF EXISTS core.guardian_enrollment_requests CASCADE;
DROP FUNCTION IF EXISTS core.search_organizations_for_enrollment CASCADE;
DROP FUNCTION IF EXISTS core.find_organization_by_public_code CASCADE;
DROP FUNCTION IF EXISTS core.request_guardian_enrollment CASCADE;
DROP FUNCTION IF EXISTS core.approve_guardian_enrollment CASCADE;
DROP FUNCTION IF EXISTS core.reject_guardian_enrollment CASCADE;
DROP FUNCTION IF EXISTS core.cancel_guardian_enrollment_request CASCADE;
DROP FUNCTION IF EXISTS core.get_my_enrollment_requests CASCADE;
DROP FUNCTION IF EXISTS core.get_org_enrollment_requests CASCADE;
DROP TYPE IF EXISTS core.enrollment_request_status CASCADE;
```

## Future Enhancements (Out of Scope for Phase 3)

1. **Email Notifications:**
   - Notify guardian when request approved/rejected
   - Notify owner of new enrollment requests

2. **Public Organization Directory:**
   - Enhanced search with filters (industry, location, rating)
   - Organization profiles with photos, hours, description

3. **Batch Approvals:**
   - Select multiple requests and approve/reject at once

4. **Auto-Approval:**
   - Allow orgs to enable auto-approval for enrollment requests
   - Optional admin review step

5. **Enrollment Request Comments:**
   - Allow back-and-forth messaging between guardian and owner

## Files Changed Summary

**Migrations (2):**
- `supabase/migrations/20260904140000_guardian_enrollment_requests.sql`
- `supabase/migrations/20260904141000_update_parent_portal_tree_with_requests.sql`

**Services (1):**
- `src/core/parent/services/enrollmentRequestService.ts` (new)

**Components (4 new):**
- `src/modules/parent/ParentRequestEnrollmentModal.tsx`
- `src/modules/parent/ParentChildSelectorModal.tsx`
- `src/modules/parent/ParentEnrollmentConsentModal.tsx`
- `src/core/academy/components/enrollments/GuardianEnrollmentRequestsView.tsx`

**Updated Components (7):**
- `src/modules/parent/ParentChildrenHome.tsx` - Added enrollment request UI
- `src/core/parent/types/globalParent.ts` - Added enrollment request types
- `src/context/AppContext.tsx` - Added enrollment-requests tab type
- `src/modules/daycare/DaycareAppContent.tsx` - Added enrollment view
- `src/modules/gym/GymAppContent.tsx` - Added enrollment view
- `src/modules/piano/PianoAppContent.tsx` - Added enrollment view
- `src/modules/*/config/nav.tsx` - Added navigation items

**Total:** 2 migrations, 14 code files changed

## Build & Lint Status
✅ TypeScript compilation passes
✅ Lint checks pass
✅ Production build successful
