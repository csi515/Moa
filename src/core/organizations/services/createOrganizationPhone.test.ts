/**
 * 신규 사업장 생성 — 전화번호는 선택, 주소는 필수
 * 실행: npm run test:create-organization-phone
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  prepareCreateOrganizationInput,
  resolveCreateBusinessPhone,
} from './createOrganizationInput';

function run() {
  assert.equal(resolveCreateBusinessPhone(undefined), null);
  assert.equal(resolveCreateBusinessPhone(null), null);
  assert.equal(resolveCreateBusinessPhone(''), null);
  assert.equal(resolveCreateBusinessPhone('   '), null);
  assert.equal(resolveCreateBusinessPhone('02-123-4567'), '02-123-4567');
  assert.equal(resolveCreateBusinessPhone('  010-1111-2222  '), '010-1111-2222');

  const prepared = prepareCreateOrganizationInput({
    name: '모아피아노',
    representativeName: '김원장',
    businessAddress: '서울시 강남구 테헤란로 1',
    industryCategory: 'education',
  });
  assert.equal(prepared.businessPhone, null);
  assert.equal(prepared.name, '모아피아노');

  const preparedWithPhone = prepareCreateOrganizationInput({
    name: '모아피아노',
    representativeName: '김원장',
    businessPhone: '010-0000-0000',
    businessAddress: '서울시 강남구 테헤란로 1',
    industryCategory: 'education',
  });
  assert.equal(preparedWithPhone.businessPhone, '010-0000-0000');

  assert.throws(
    () =>
      prepareCreateOrganizationInput({
        name: '모아피아노',
        representativeName: '김원장',
        businessAddress: '',
        industryCategory: 'education',
      }),
    /사업장 주소를 입력해 주세요/
  );
  assert.throws(
    () =>
      prepareCreateOrganizationInput({
        name: '모아피아노',
        representativeName: '',
        businessAddress: '서울시 강남구',
        industryCategory: 'education',
      }),
    /대표자명을 입력해 주세요/
  );
  assert.doesNotThrow(() =>
    prepareCreateOrganizationInput({
      name: '모아피아노',
      representativeName: '김원장',
      businessPhone: '',
      businessAddress: '서울시 강남구',
      industryCategory: 'education',
    })
  );

  const here = dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(
    join(
      here,
      '../../../../supabase/migrations/20260925120000_create_organization_optional_phone.sql'
    ),
    'utf8'
  );
  assert.match(sql, /v_phone := NULLIF/);
  assert.equal(sql.includes("RAISE EXCEPTION '사업장 전화번호를 입력해 주세요.'"), false);
  assert.match(sql, /사업장 주소를 입력해 주세요/);
  assert.match(sql, /사업장 전화번호는 선택/);

  console.log('createOrganizationPhone.test.ts: ok');
}

run();
