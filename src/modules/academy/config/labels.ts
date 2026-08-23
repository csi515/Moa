/**
 * 종합학원 모듈 UI 라벨
 * Piano 공유 컴포넌트와 동일한 ModuleLabels 형태
 */
export interface ModuleLabels {
  customer: {
    singular: string;
    plural: string;
    management: string;
    section: string;
    add: string;
    search: string;
  };
  contact: {
    singular: string;
    plural: string;
    management: string;
  };
  staff: {
    singular: string;
    plural: string;
    management: string;
  };
  service: {
    singular: string;
    plural: string;
    management: string;
  };
  schedule: {
    singular: string;
    plural: string;
    management: string;
  };
}

export const academyModuleLabels: ModuleLabels = {
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
