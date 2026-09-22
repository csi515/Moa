/**
 * [권한] UX 권한 fail-closed 불변식
 * 실행: npm run test:permissions-invariant
 *
 * Invariant:
 *   - unknown role → admin 권한 없음
 *   - customer → staff/admin 등급 아님 (탭 none)
 *   - null/member → admin 폴백 금지
 *
 * 순수 role 헬퍼만 검사 (plugin/supabase 로드 없음).
 * 탭 목록 조립은 getAllowedTabs → resolveRoleAccessKind('none')이면 [].
 * DB 권한: test:rls-* / test:multi-role-helpers
 */
import assert from 'node:assert/strict';
import {
  isOrgAdmin,
  isStaffRole,
  resolveRoleAccessKind,
} from './permissionsRole';

// ── unknown role → admin 없음 ─────────────────────────────────────
{
  assert.equal(isOrgAdmin('unknown'), false);
  assert.equal(isStaffRole('unknown'), false);
  assert.equal(resolveRoleAccessKind('unknown'), 'none');
  assert.equal(resolveRoleAccessKind('superadmin'), 'none');
}

// ── customer → staff/admin 기능 등급 불가 ─────────────────────────
{
  assert.equal(isOrgAdmin('customer'), false);
  assert.equal(isStaffRole('customer'), false);
  assert.equal(resolveRoleAccessKind('customer'), 'none');
}

// ── member / null → admin 폴백 금지 ───────────────────────────────
{
  assert.equal(resolveRoleAccessKind('member'), 'none');
  assert.equal(resolveRoleAccessKind(null), 'none');
  assert.equal(resolveRoleAccessKind(undefined), 'none');
  assert.equal(isOrgAdmin(null), false);
}

// ── parent는 admin/staff 아님 (포털 전용) ─────────────────────────
{
  assert.equal(resolveRoleAccessKind('parent'), 'parent');
  assert.equal(isOrgAdmin('parent'), false);
  assert.equal(isStaffRole('parent'), false);
}

// ── 대조: owner/staff 등급 ───────────────────────────────────────
{
  assert.equal(resolveRoleAccessKind('owner'), 'admin');
  assert.equal(resolveRoleAccessKind('admin'), 'admin');
  assert.equal(resolveRoleAccessKind('manager'), 'admin');
  assert.equal(resolveRoleAccessKind('staff'), 'staff');
  assert.equal(resolveRoleAccessKind('instructor'), 'staff');
  assert.equal(isOrgAdmin('owner'), true);
  assert.equal(isOrgAdmin('staff'), false);
}

console.log('permissions.invariant.test.ts: ok');
