/**
 * 월회비 자동 생성 대상 판정
 * 실행: npm run test:monthly-tuition-eligibility
 */
import assert from 'node:assert/strict';
import type { Student } from '@/types';
import {
  filterMonthlyTuitionAutoGenerateStudents,
  isMonthlyTuitionAutoGenerateEligible,
} from './monthlyTuitionEligibility';

function student(
  partial: Pick<Student, 'id'> & Partial<Pick<Student, 'billingMode' | 'status' | 'joinDate' | 'name'>>
): Pick<Student, 'id' | 'name' | 'billingMode' | 'status' | 'joinDate'> {
  return {
    id: partial.id,
    name: partial.name ?? '원생',
    billingMode: partial.billingMode ?? 'monthly',
    status: partial.status ?? 'active',
    joinDate: partial.joinDate ?? '2026-01-01',
  };
}

function run() {
  const september = '2026-09';

  assert.equal(
    isMonthlyTuitionAutoGenerateEligible(student({ id: 'a', status: 'active', billingMode: 'monthly' }), september),
    true
  );
  assert.equal(
    isMonthlyTuitionAutoGenerateEligible(
      student({ id: 'b', status: 'active', billingMode: 'session_pass' }),
      september
    ),
    false
  );
  assert.equal(
    isMonthlyTuitionAutoGenerateEligible(
      student({ id: 'c', status: 'withdrawn', billingMode: 'monthly' }),
      september
    ),
    false
  );

  // 휴원: 기존 일괄 생성과 동일하게 제외 (미납 회수 대상과는 별개)
  assert.equal(
    isMonthlyTuitionAutoGenerateEligible(student({ id: 'd', status: 'leave', billingMode: 'monthly' }), september),
    false
  );

  assert.equal(
    isMonthlyTuitionAutoGenerateEligible(
      student({ id: 'e', status: 'active', billingMode: 'monthly', joinDate: '2026-09-15' }),
      september
    ),
    true
  );
  assert.equal(
    isMonthlyTuitionAutoGenerateEligible(
      student({ id: 'f', status: 'active', billingMode: 'monthly', joinDate: '2026-10-01' }),
      september
    ),
    false
  );

  const roster = [
    student({ id: 'active-monthly', status: 'active', billingMode: 'monthly' }),
    student({ id: 'active-pass', status: 'active', billingMode: 'session_pass' }),
    student({ id: 'withdrawn-monthly', status: 'withdrawn', billingMode: 'monthly' }),
    student({ id: 'leave-monthly', status: 'leave', billingMode: 'monthly' }),
    student({ id: 'future-join', status: 'active', billingMode: 'monthly', joinDate: '2026-10-01' }),
  ];
  assert.deepEqual(
    filterMonthlyTuitionAutoGenerateStudents(roster, september).map((row) => row.id),
    ['active-monthly']
  );

  console.log('monthlyTuitionEligibility.test.ts: ok');
}

run();
