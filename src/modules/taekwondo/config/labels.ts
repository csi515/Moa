import type { ModuleLabels } from '@/core/labels/types';

export type { ModuleLabels };

/** 태권도장 UI 라벨 */
export const taekwondoModuleLabels: ModuleLabels = {
  customer: {
    singular: '수련생',
    plural: '수련생',
    management: '수련생 관리',
    section: '수련생 및 보호자',
    add: '수련생 등록',
    search: '수련생 검색',
  },
  contact: {
    singular: '보호자',
    plural: '보호자',
    management: '보호자 관리',
  },
  staff: {
    singular: '사범',
    plural: '사범',
    management: '사범 관리',
    section: '지도진',
  },
  service: {
    singular: '반',
    plural: '반',
    management: '수업반 관리',
    section: '수업 및 출결',
  },
  schedule: {
    singular: '시간표',
    plural: '시간표',
    management: '주간 시간표',
    section: '수업 일정',
  },
};
