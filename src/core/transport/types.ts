/** 셔틀 픽업·하원 방향 */
export type ShuttleDirection = 'pickup' | 'dropoff' | 'both';

/** 학생별 픽업·하원 주소 */
export interface PickupAddress {
  id: string;
  label: string;
  address: string;
  detail?: string;
  contactName?: string;
  contactPhone?: string;
  directions?: string;
  shuttleDirection: ShuttleDirection;
  isDefault?: boolean;
}

export const SHUTTLE_DIRECTION_LABEL: Record<ShuttleDirection, string> = {
  pickup: '픽업만',
  dropoff: '하원만',
  both: '픽업·하원',
};

export const SHUTTLE_DIRECTION_OPTIONS: { value: ShuttleDirection; label: string }[] = [
  { value: 'both', label: SHUTTLE_DIRECTION_LABEL.both },
  { value: 'pickup', label: SHUTTLE_DIRECTION_LABEL.pickup },
  { value: 'dropoff', label: SHUTTLE_DIRECTION_LABEL.dropoff },
];

export const PICKUP_ADDRESS_LABEL_PRESETS = ['집', '할머니댁', '학교', '기타'] as const;
