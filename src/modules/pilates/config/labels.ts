export interface ModuleLabels {
  customer: {
    section: string;
    management: string;
    singular: string;
  };
  staff: {
    section: string;
    management: string;
    singular: string;
  };
  service: {
    section: string;
    management: string;
    singular: string;
  };
  schedule: {
    section: string;
    management: string;
    singular: string;
  };
}

export const pilatesModuleLabels: ModuleLabels = {
  customer: {
    section: '회원',
    management: '회원 관리',
    singular: '회원',
  },
  staff: {
    section: '강사',
    management: '강사 관리',
    singular: '강사',
  },
  service: {
    section: '수업',
    management: '수업 종류',
    singular: '수업',
  },
  schedule: {
    section: '예약',
    management: '예약 캘린더',
    singular: '예약',
  },
};
