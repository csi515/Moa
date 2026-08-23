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
  careProgram: {
    section: string;
    management: string;
    singular: string;
  };
}

export const skincareModuleLabels: ModuleLabels = {
  customer: {
    section: '고객',
    management: '고객 관리',
    singular: '고객',
  },
  staff: {
    section: '관리사',
    management: '관리사 관리',
    singular: '관리사',
  },
  service: {
    section: '시술',
    management: '시술 메뉴',
    singular: '시술',
  },
  schedule: {
    section: '예약',
    management: '예약 캘린더',
    singular: '예약',
  },
  careProgram: {
    section: '케어 프로그램',
    management: '케어 프로그램',
    singular: '프로그램',
  },
};
