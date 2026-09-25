/**
 * 사용자용 오류 메시지 분류.
 * 실행: npm run test:user-facing-error
 */
import assert from 'node:assert/strict';
import { classifyUserFacingError, userFacingErrorMessage } from './userFacingError';

function run() {
  assert.equal(classifyUserFacingError(new Error('failed to fetch')), 'network');
  assert.equal(classifyUserFacingError(new Error('permission denied')), 'permission');
  assert.equal(classifyUserFacingError(new Error('duplicate key')), 'conflict');
  assert.equal(
    classifyUserFacingError(new Error('PostgREST internal detail...')),
    'temporary'
  );

  const postgrest = userFacingErrorMessage(
    new Error('PostgREST internal detail: relation "core.secret" does not exist')
  );
  assert.equal(postgrest.includes('PostgREST'), false);
  assert.equal(postgrest.includes('core.secret'), false);
  assert.equal(postgrest.includes('relation'), false);

  const fetchMsg = userFacingErrorMessage(new Error('failed to fetch'));
  assert.equal(fetchMsg.includes('failed to fetch'), false);

  console.log('userFacingError.test.ts: ok');
}

run();
