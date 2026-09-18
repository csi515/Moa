/**
 * 수강생 CSV 파서·검증 단위 테스트
 * 실행: npx tsx src/core/students/bulkImport/studentBulkImport.test.ts
 */
import assert from 'node:assert/strict';
import { parseStudentImportCsv } from './parseStudentImport';
import {
  validateStudentImportRows,
  buildTemplateCsv,
  normalizePhoneDigits,
} from './validateStudentImport';

function run(): void {
  assert.equal(normalizePhoneDigits('010-1234-5678'), '01012345678');

  const template = buildTemplateCsv();
  assert.ok(template.includes('이름'));
  assert.ok(template.includes('보호자전화'));

  const csv = [
    '이름,성별,생년월일,연락처,학교,학년,보호자이름,보호자전화,보호자이메일,관계,입학일,월수강료,납부일,메모',
    '김민수,남,2015-03-12,,서울초,초3,김부모,010-1234-5678,a@b.com,모,2024-01-01,180000,10,',
    ',남,,,,,,01099998888,,,,,',
    '이서연,여,2016-01-01,,부산초,초2,이부모,01087654321,,부,2024-02-01,200000,15,',
  ].join('\n');

  const rows = parseStudentImportCsv(csv);
  assert.equal(rows.length, 3);

  const result = validateStudentImportRows(rows, new Set());
  assert.equal(result.validRows.length, 2);
  assert.ok(result.errors.some((e) => e.rowNumber === 3));
  assert.equal(result.validRows[0].guardianPhone, '01012345678');
  assert.equal(result.validRows[0].relationship, 'mother');

  const adultCsv = ['이름,보호자이름,보호자전화', '박성인,,'].join('\n');
  const adultRows = parseStudentImportCsv(adultCsv);
  const adultResult = validateStudentImportRows(adultRows, new Set());
  assert.equal(adultResult.validRows.length, 1);
  assert.equal(adultResult.validRows[0].isAdultSelf, true);

  console.log('studentBulkImport.test.ts: all assertions passed');
}

run();
