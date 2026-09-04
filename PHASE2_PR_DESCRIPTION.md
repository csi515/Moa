# Phase 2: Customer Join & Organization Discovery 🎯

## Overview

This PR implements **Phase 2** from the multi-role architecture document (`docs/MOA_MULTI_ROLE_ARCHITECTURE.md`). It enables customers to discover organizations, submit join requests, and allows organization owners to manage those requests.

## What Changed

### 1. Database Migration ✅

**File:** `supabase/migrations/20260904130000_phase2_customer_join_org_discovery.sql`

- **Public organization codes** (`public_code` column) for easy sharing via QR/deep links
- **Public org search RPCs** (no auth required):
  - `search_public_organizations(query, industry_type, limit)`
  - `get_public_organization_by_code(code)`
- **Customer join requests table** (`customer_join_requests`)
  - Statuses: pending, approved, rejected, cancelled
  - RLS policies for applicants and org owners
- **Join request RPCs**:
  - `submit_customer_join_request()` - authenticated users
  - `approve_customer_join_request()` - owner/admin only
  - `reject_customer_join_request()` - owner/admin only
- **Public consultation RPC** (`submit_public_consultation()`) - no auth required

### 2. Frontend Components ✅

**New Components:**
- `SignUpTypeSelector` - Account type selection (사업주/강사/고객/학부모)
- `PublicOrgLanding` - `/c/:code` landing page with org info, join CTA, and consult form
- `CustomerSignUpFlow` - 3-step wizard (search → request → pending)
- `CustomerJoinRequestsPanel` - Owner/admin approval UI with approve/reject actions

**Updated Components:**
- `App.tsx` - Added React Router and routing for `/c/:code` and `/signup/customer`
- Added database types for new RPC functions

**New Services:**
- `publicOrgService` - Public org discovery (search, get by code, submit consultation)
- `customerJoinService` - Join request management (submit, approve, reject, list)

### 3. Type Definitions ✅

Added to `src/types/index.ts`:
- `PublicOrgInfo` - Public organization data
- `CustomerJoinRequest` - Join request data
- `JoinRequestStatus` - pending | approved | rejected | cancelled
- `JoinRequestType` - membership | trial | consultation
- `SignUpType` - business | instructor | customer | guardian
- `ConsultationSubmission` - Consultation form data

## Phase 2 Goals ✅

1. ✅ **Signup account types** - SignUpTypeSelector component for role selection
2. ✅ **Org discovery** - Search by name/code/address, auto-generated public codes, `/c/:code` deep links
3. ✅ **Customer join requests** - Full workflow from search → request → approval
4. ✅ **Consult QR (lightweight)** - Public consultation form on landing page
5. ✅ **Korean UI, indigo theme, mobile-first** - All new components follow design system

## Migration Steps for Parent

⚠️ **Database migration required before using Phase 2 features**

```bash
# 1. Apply migration to development
supabase db push

# 2. Verify migration
# Check public_code column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'organizations' AND column_name = 'public_code';

# Check new RPCs exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%customer_join%' OR routine_name LIKE '%public%';

# 3. Generate public codes for existing orgs (optional)
UPDATE core.organizations 
SET public_code = core.generate_public_code() 
WHERE public_code IS NULL AND is_active = true;

# 4. Test in development
# - Visit /c/TESTCODE (replace with actual public_code)
# - Search for organizations
# - Submit join request
# - Approve/reject as owner

# 5. Apply to production when ready
# Run same migration on production database
```

## Testing Notes

### Lint & Build Status
- ✅ Linter passes (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ⚠️ Manual testing pending (requires live DB with migration applied)

### Manual Testing Checklist

**Public Landing Page (`/c/:code`)**
- [ ] Visit `/c/ABCD1234` with valid code → shows org info
- [ ] Invalid code → shows error message
- [ ] "회원 가입 신청" button → redirects to signup flow
- [ ] "무료 상담 예약" form → submits successfully
- [ ] QR code displays and links to correct URL

**Customer Signup Flow**
- [ ] Search organizations by name, code, address
- [ ] Select organization → shows join request form
- [ ] Submit request → creates pending request
- [ ] View "내 신청 현황" → shows all user's requests
- [ ] Status badges display correctly (pending/approved/rejected)

**Owner Approval UI**
- [ ] Pending requests show in CustomerJoinRequestsPanel
- [ ] Approve request → creates customer + organization_members entry
- [ ] Reject request → updates status and stores reason
- [ ] Filter by pending/all works correctly
- [ ] Count badge shows pending count

**Routing**
- [ ] `/c/:code` deep links work
- [ ] `/signup/customer` route works
- [ ] Existing routes still work (not broken)

## Out of Scope

- ❌ Phase 3 guardian/child overhaul
- ❌ Phase 4 module membership/passes cleanup
- ❌ Merging PR #73 as-is (will integrate patterns manually in future)
- ❌ Naver/Kakao OAuth
- ❌ Instructor join flow (separate from customer flow)
- ❌ Guardian pre-registration flow

## Files Changed

```
supabase/migrations/
  └─ 20260904130000_phase2_customer_join_org_discovery.sql (NEW)

src/
  ├─ App.tsx (UPDATED - added routing)
  ├─ types/index.ts (UPDATED - added Phase 2 types)
  ├─ lib/supabase/database.types.ts (UPDATED - added RPC types)
  ├─ core/
  │   ├─ auth/components/SignUpTypeSelector.tsx (NEW)
  │   ├─ customer/
  │   │   ├─ CustomerSignUpFlow.tsx (NEW)
  │   │   ├─ CustomerJoinRequestsPanel.tsx (NEW)
  │   │   └─ services/customerJoinService.ts (NEW)
  │   └─ public/
  │       ├─ PublicOrgLanding.tsx (NEW)
  │       └─ services/publicOrgService.ts (NEW)

package.json (UPDATED - added react-router-dom@6.28.0)
```

## Next Steps (Post-Merge)

1. **Update ParentShell** to preserve SupabaseRoleSync (mentioned in requirements)
2. **Update RoleContextSwitcher** to handle customer role
3. **Add CustomerJoinRequestsPanel** to owner/admin settings or customers tab
4. **Generate public codes** for existing organizations
5. **Phase 3**: Guardian/child global model integration

## Breaking Changes

None. This is an additive-only PR:
- ✅ Backward compatible migration (new columns, tables, RPCs only)
- ✅ No changes to existing auth flow
- ✅ No changes to existing organization management
- ✅ Phase 1 features (multi-role, RoleContextSwitcher) preserved

## Security Notes

- ⚠️ Public RPCs (`search_public_organizations`, `get_public_organization_by_code`, `submit_public_consultation`) are accessible without authentication - this is intentional for public discovery
- ✅ Customer join requests use authenticated RPC (`submit_customer_join_request`)
- ✅ Approval/rejection RPCs require owner/admin role
- ✅ RLS policies protect all sensitive data
- ⚠️ Consider rate limiting for public RPCs in production

---

**Related Documents:**
- [MOA Multi-Role Architecture](../docs/MOA_MULTI_ROLE_ARCHITECTURE.md)
- [Phase 1 Migration Steps](../PHASE1_MIGRATION_STEPS.md)
