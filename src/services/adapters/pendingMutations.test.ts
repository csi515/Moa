/**
 * 오프라인 pending mutation — hydrate overwrite / org 격리 / 충돌.
 * 실행: npm run test:pending-mutations
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_KEYS } from './storageKeys';
import { setOrganizationId } from './storageContext';
import { writeLocal } from './localStorageEngine';
import {
  applyDirtyListMerge,
  clearPendingForKey,
  hasPendingConflicts,
  hasPendingForKey,
  markPendingConflict,
  markPendingDelete,
  markPendingUpsert,
  mergeEntityListsById,
  peekPendingMutations,
} from './pendingMutations';

function installMemoryLocalStorage(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null;
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      key() {
        return null;
      },
      get length() {
        return store.size;
      },
    },
    configurable: true,
  });
}

function run() {
  installMemoryLocalStorage();

  // 시나리오 A: 오프라인 예약 수정은 remote snapshot에 덮이지 않는다
  {
    const remote = [
      { id: 'bk-a', memo: 'remote' },
      { id: 'bk-b', memo: 'from-device-b' },
    ];
    const local = [{ id: 'bk-a', memo: 'offline-edit' }];
    const { merged, conflictIds } = mergeEntityListsById({ remote, local });
    assert.equal(merged.find((r) => r.id === 'bk-a')?.memo, 'offline-edit');
    assert.equal(merged.find((r) => r.id === 'bk-b')?.memo, 'from-device-b');
    assert.deepEqual(conflictIds, ['bk-a']);
  }

  // 시나리오 B: 오프라인 출결은 remote-only 행을 지우지 않고 local 입력을 유지
  {
    const remote = [{ id: 'att-remote', status: 'absent' }];
    const local = [
      { id: 'att-remote', status: 'absent' },
      { id: 'att-offline', status: 'present' },
    ];
    const { merged } = mergeEntityListsById({ remote, local });
    assert.equal(merged.some((r) => r.id === 'att-offline' && r.status === 'present'), true);
    assert.equal(merged.some((r) => r.id === 'att-remote'), true);
  }

  // 시나리오 C: 같은 entity 양쪽 수정 → 자동 remote overwrite 금지, conflict 표시
  {
    setOrganizationId('org-a');
    writeLocal(STORAGE_KEYS.SCHEDULES, [{ id: 'bk-a', memo: 'local' }]);
    markPendingUpsert(STORAGE_KEYS.SCHEDULES, 'bk-a');
    const merged = applyDirtyListMerge(STORAGE_KEYS.SCHEDULES, [{ id: 'bk-a', memo: 'other-device' }]);
    assert.equal(merged[0].memo, 'local');
    assert.equal(hasPendingConflicts('org-a'), true);
    clearPendingForKey(STORAGE_KEYS.SCHEDULES);
  }

  // 명시적 삭제 tombstone은 hydrate에서 다시 살리지 않음
  {
    const { merged } = mergeEntityListsById({
      remote: [{ id: 'bk-del' }, { id: 'bk-keep' }],
      local: [{ id: 'bk-keep' }],
      pendingDeleteIds: ['bk-del'],
    });
    assert.equal(merged.some((r) => r.id === 'bk-del'), false);
    assert.equal(merged.some((r) => r.id === 'bk-keep'), true);
  }

  // 시나리오 D: organization A pending은 B에 적용되지 않음
  {
    setOrganizationId('org-a');
    markPendingUpsert(STORAGE_KEYS.ATTENDANCE, 'att-a');
    assert.equal(hasPendingForKey(STORAGE_KEYS.ATTENDANCE, 'org-a'), true);
    assert.equal(hasPendingForKey(STORAGE_KEYS.ATTENDANCE, 'org-b'), false);
    setOrganizationId('org-b');
    assert.equal(peekPendingMutations('org-b').length, 0);
    assert.equal(hasPendingForKey(STORAGE_KEYS.ATTENDANCE), false);
    markPendingDelete(STORAGE_KEYS.SCHEDULES, 'bk-b');
    assert.equal(peekPendingMutations('org-a').some((m) => m.entityId === 'bk-b'), false);
    assert.equal(peekPendingMutations('org-b').some((m) => m.entityId === 'bk-b'), true);
  }

  markPendingConflict(STORAGE_KEYS.SCHEDULES, 'bk-b');
  assert.equal(hasPendingConflicts('org-b'), true);

  const here = dirname(fileURLToPath(import.meta.url));
  const adapter = readFileSync(join(here, 'supabaseAdapter.ts'), 'utf8');
  assert.match(adapter, /markPendingUpsert/);
  assert.match(adapter, /clearPendingForKey/);
  assert.match(adapter, /enqueueSyncOutbox/);

  const hydrator = readFileSync(join(here, '../../StorageHydrator.tsx'), 'utf8');
  assert.match(hydrator, /addEventListener\('online'/);
  assert.match(hydrator, /flushSyncOutbox/);
  assert.match(hydrator, /runQuietRehydrate/);
  assert.equal(hydrator.includes('if (!isNativeApp()) return'), false);

  const hydrate = readFileSync(join(here, 'sync/coreEntityHydrate.ts'), 'utf8');
  assert.match(hydrate, /applyDirtyListMerge\(STORAGE_KEYS\.SCHEDULES/);
  assert.match(hydrate, /applyDirtyListMerge\(STORAGE_KEYS\.SESSION_PASSES/);

  const pianoHydrate = readFileSync(join(here, 'sync/pianoEntitySync.ts'), 'utf8');
  assert.match(pianoHydrate, /applyDirtyListMerge\(/);
  assert.match(pianoHydrate, /STORAGE_KEYS\.ATTENDANCE/);

  setOrganizationId(null);
  console.log('pendingMutations.test.ts: ok');
}

run();
