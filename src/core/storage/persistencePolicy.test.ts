/**
 * persistence policy 선언.
 * 실행: npm run test:persistence-policy
 */
import assert from 'node:assert/strict';
import {
  DECLARED_STORAGE_KEY_POLICIES,
  localWriteConfirmsPersist,
  OFFLINE_COMMAND_STORE_POLICIES,
  persistencePolicyFor,
  persistenceRuleFor,
} from './persistencePolicy';

function run() {
  assert.equal(persistencePolicyFor('piano_app_tuition_payments'), 'server-authoritative');
  assert.equal(persistencePolicyFor('core_session_passes'), 'server-authoritative');
  assert.equal(persistencePolicyFor('piano_app_students'), 'server-with-local-cache');
  assert.equal(persistencePolicyFor('piano_app_active_user'), 'local-only');
  assert.equal(OFFLINE_COMMAND_STORE_POLICIES.pendingMutations, 'offline-command');
  assert.equal(OFFLINE_COMMAND_STORE_POLICIES.syncOutbox, 'offline-command');

  assert.equal(localWriteConfirmsPersist('piano_app_tuition_payments'), false);
  assert.equal(localWriteConfirmsPersist('piano_app_students'), false);
  assert.equal(localWriteConfirmsPersist('piano_app_active_user'), true);
  assert.equal(persistenceRuleFor('core_schedules').sourceOfTruth, 'server');
  assert.equal(DECLARED_STORAGE_KEY_POLICIES.piano_app_invoices, 'server-authoritative');

  console.log('persistencePolicy.test.ts: ok');
}

run();
