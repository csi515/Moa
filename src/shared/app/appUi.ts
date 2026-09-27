/**
 * Capability 잔여 adapter. AppContext를 re-export한다.
 * Core는 이 파일을 import하지 않는다. 탭/학생은 nav session, currentUser는 StorageService.
 */
export { useApp } from '@/context/AppContext';
export type { ConfirmDialogOptions } from '@/context/AppContext';
