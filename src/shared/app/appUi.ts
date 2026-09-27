/**
 * Core/Capability는 AppContext를 직접 import하지 않는다.
 * toast/confirm/tab hook이 필요하면 이 진입점을 쓴다. 동작은 AppContext와 동일하다.
 */
export { useApp } from '@/context/AppContext';
export type { ConfirmDialogOptions } from '@/context/AppContext';
