# Phase 1 Multi-Role Architecture - Migration Steps

## Overview

This PR implements Phase 1 of the multi-role architecture as described in `docs/MOA_MULTI_ROLE_ARCHITECTURE.md`. It enables users to have multiple organization memberships with different roles and switch between them without logging out.

## What Changed

### 1. Database Migration

**File:** `supabase/migrations/20260904100000_phase1_multi_role_architecture.sql`

Key changes:
- **Removed** `UNIQUE(organization_id, user_id)` constraint (1 user → 1 org limitation)
- **Added** `UNIQUE(organization_id, user_id, role)` constraint (allows multiple roles per user per org)
- **Extended** `member_role` enum with new values:
  - `instructor` (강사)
  - `member` (회원)
  - `customer` (고객)
  - `guardian` (보호자)
- **Added** `active_membership_id` column to `profiles` table for context persistence
- **Created** new RPC functions:
  - `get_user_memberships()` - Fetch all memberships with active context
  - `set_active_membership(p_membership_id)` - Switch active context
  - `clear_active_membership()` - Clear active context

### 2. Frontend Changes

**Modified files:**
- `src/core/organizations/OrganizationProvider.tsx` - Refactored to support multiple memberships
- `src/core/organizations/services/organizationService.ts` - Added new service functions
- `src/lib/supabase/database.types.ts` - Updated MemberRole type
- `src/types/index.ts` - Updated UserRole type
- `src/core/auth/permissions.ts` - Added labels for new roles

**New files:**
- `src/core/organizations/RoleContextSwitcher.tsx` - Korean UI component for role switching

**Updated components:**
- `src/shared/components/layout/Header.tsx` - Uses new RoleContextSwitcher

### 3. Key Features

✅ **Multiple Memberships**: One user can have multiple roles across multiple organizations
✅ **Context Switching**: Switch between roles without logout
✅ **Korean UI**: 사업장 관리 / 강사 활동 / 내가 다니는 곳 / 학부모 포털
✅ **Mobile-Friendly**: Responsive design with 44px+ touch targets
✅ **Indigo Theme**: Consistent with existing design system
✅ **Backward Compatible**: Existing code continues to work

## Migration Apply Steps

### Prerequisites

- Supabase CLI installed and authenticated
- Local Supabase instance running OR access to remote Supabase project
- Database backup recommended before applying migration

### Step 1: Review Migration

```bash
# Review the migration file
cat supabase/migrations/20260904100000_phase1_multi_role_architecture.sql
```

### Step 2: Apply Migration to Development

**Option A: Local Supabase**
```bash
# Start local Supabase
supabase start

# Apply migration
supabase db push
```

**Option B: Remote Supabase (via MCP)**
```bash
# Using Supabase MCP tools
# In Cursor, use the Supabase MCP integration to apply the migration
# Or use Supabase CLI:
supabase link --project-ref your-project-ref
supabase db push
```

### Step 3: Verify Migration

```sql
-- Check that the new constraint exists
SELECT conname, contype, conkey
FROM pg_constraint
WHERE conrelid = 'core.organization_members'::regclass;

-- Check that new enum values exist
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'core.member_role'::regtype
ORDER BY enumsortorder;

-- Check that active_membership_id column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'core'
  AND table_name = 'profiles'
  AND column_name = 'active_membership_id';

-- Test new RPCs
SELECT * FROM core.get_user_memberships();
```

### Step 4: Test Frontend Changes

```bash
# Install dependencies (if needed)
npm install

# Run linter
npm run lint

# Build the application
npm run build

# Start development server
npm run dev
```

### Step 5: Manual Testing Checklist

- [ ] Login as existing user with single organization
- [ ] Verify organization loads correctly (backward compatibility)
- [ ] Create a second organization or add user to another organization
- [ ] Verify RoleContextSwitcher appears in header
- [ ] Click RoleContextSwitcher and verify dropdown shows all memberships
- [ ] Switch to different organization/role
- [ ] Verify context switches without logout
- [ ] Verify navigation tabs update based on role
- [ ] Test on mobile viewport (responsive behavior)
- [ ] Verify Korean labels are correct

### Step 6: Apply to Production

⚠️ **Important Notes:**
- Test thoroughly in development/staging first
- This is an **additive** migration (no data loss)
- Existing users will continue to work normally
- New features will be available immediately after migration

```bash
# Production deployment
supabase link --project-ref your-production-ref
supabase db push

# Or use your CI/CD pipeline
# The migration will be automatically applied during deployment
```

## Rollback Plan

If issues occur, the migration can be partially rolled back:

```sql
-- Remove new columns (if needed)
ALTER TABLE core.profiles DROP COLUMN IF EXISTS active_membership_id;

-- Remove new RPC functions
DROP FUNCTION IF EXISTS core.get_user_memberships();
DROP FUNCTION IF EXISTS core.set_active_membership(UUID);
DROP FUNCTION IF EXISTS core.clear_active_membership();

-- NOTE: Cannot easily remove enum values or change constraints
-- without rebuilding affected data
-- Recommend forward-fix rather than rollback
```

## What NOT to Do

❌ Do NOT merge PR #73 yet (conflicts with Phase 1)
❌ Do NOT delete existing features or tables
❌ Do NOT implement Phase 2-5 features
❌ Do NOT modify onboarding flow (PR #72) - it's preserved

## Next Steps (Phase 2)

After Phase 1 is stable:
- Public organization codes and QR
- Customer self-signup flow
- Join request approval workflow

See `docs/MOA_MULTI_ROLE_ARCHITECTURE.md` for full roadmap.

## Support

For questions or issues:
1. Check `docs/MOA_MULTI_ROLE_ARCHITECTURE.md`
2. Review migration SQL comments
3. Test in local environment first
4. Report issues in PR comments
