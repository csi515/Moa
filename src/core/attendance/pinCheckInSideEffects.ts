/**
 * PIN 체크인 성공 후 업종별 부가 동기화.
 * Core 키오스크가 Module을 import하지 않도록 등록식으로 연결한다.
 */
export type PinCheckInSideEffect = (customerId: string) => { warning?: string } | void;

const sideEffects: PinCheckInSideEffect[] = [];

export function registerPinCheckInSideEffect(effect: PinCheckInSideEffect): () => void {
  sideEffects.push(effect);
  return () => {
    const idx = sideEffects.indexOf(effect);
    if (idx >= 0) sideEffects.splice(idx, 1);
  };
}

export function runPinCheckInSideEffects(customerId: string): { warning?: string } {
  for (const effect of sideEffects) {
    const result = effect(customerId);
    if (result?.warning) return { warning: result.warning };
  }
  return {};
}
