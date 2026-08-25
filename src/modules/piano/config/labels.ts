import type { ModuleLabels } from '@/core/labels/types';

export type { ModuleLabels };

/** Piano Academy 기본 라벨 (원생/선생님/학부모) */
export const pianoModuleLabels: ModuleLabels = {
  customer: {
    singular: '원생',
    plural: '원생',
    management: '원생 관리',
    section: '원생 및 학부모',
    add: '원생 등록',
    search: '원생 검색',
  },
  contact: {
    singular: '학부모',
    plural: '학부모',
    management: '학부모 관리',
  },
  staff: {
    singular: '선생님',
    plural: '선생님',
    management: '선생님 관리',
  },
  service: {
    singular: '반',
    plural: '반',
    management: '반/수업 관리',
  },
  schedule: {
    singular: '시간표',
    plural: '시간표',
    management: '주간 시간표',
  },
};
