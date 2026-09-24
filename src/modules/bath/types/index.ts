export type BathModuleId = 'sauna_jjimjilbang';

export type {
  BathVisit,
  BathVisitStatus,
  BathVisitCheckInInput,
  BathVisitMutationAction,
  BathVisitMutationResult,
} from './visit';

export {
  BATH_FLOOR_TYPES,
  BATH_FLOOR_TYPE_LABELS,
  BATH_ROOM_RESOURCE_KIND,
  BATH_ROOM_TYPES,
  BATH_ROOM_TYPE_LABELS,
} from './room';
export type {
  BathFloorType,
  BathRoom,
  BathRoomListQuery,
  BathRoomType,
  BathRoomWriteInput,
} from './room';
