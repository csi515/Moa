/**
 * Industry capability 조합 타입. Composition 책임.
 * Core는 Capability 구현을 import하지 않고, 이 파일이 ID 집합을 닫는다.
 */
import type { CapabilityId } from '@/capabilities';
import type { IndustryCapabilityId } from '@/core/industry/industryCapabilities';

declare module '@/core/industry/industryCapabilities' {
  interface IndustryCapabilityIds extends Record<CapabilityId, true> {}
}

type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _capabilityIdsMatch: AssertEqual<IndustryCapabilityId, CapabilityId> = true;
void _capabilityIdsMatch;

export type { IndustryCapabilityFlagMap, IndustryCapabilityId } from '@/core/industry/industryCapabilities';
export type { CapabilityId };
