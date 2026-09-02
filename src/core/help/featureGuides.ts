import { normalizeIndustryType, type IndustryType } from '@/core/industry/types';
import {
  buildBillingSection,
  buildClassesSection,
  buildCustomerSection,
  buildStaffSection,
  type FeatureGuideSection,
} from './guideBuilders';

export type { FeatureGuideItem, FeatureGuideSection } from './guideBuilders';

/** 공통 — 모든 업종 */
const COMMON_FINANCE: FeatureGuideSection = {
  id: 'finance',
  title: '재무',
  description: '사업장 수입·지출을 한곳에서 관리합니다.',
  items: [
    {
      id: 'finance',
      title: '재무 요약',
      summary: '이번 달 수입·지출·손익을 한눈에 봅니다.',
    },
    {
      id: 'income',
      title: '수입 관리',
      summary: '수강료 외 수입(교재 판매, 기타)을 기록합니다.',
    },
    {
      id: 'expenses',
      title: '지출 관리',
      summary: '임대료·인건비·소모품 등 지출을 기록합니다.',
    },
  ],
};

const COMMON_SETTINGS: FeatureGuideSection = {
  id: 'settings',
  title: '설정',
  description: '사업장 기본 정보와 기능 on/off를 다룹니다.',
  items: [
    {
      id: 'settings',
      title: '사업장 설정',
      summary: '상호·연락처·계좌·출입(핀번호) 사용 여부를 설정합니다.',
      howTo: '출입 관리를 쓰면 PIN 입·퇴실 메뉴가 열리고, 끄면 메뉴가 숨겨집니다.',
    },
    {
      id: 'attendance',
      title: '출입 관리 (핀번호)',
      summary: '회원마다 PIN을 주고, 키패드로 입실·퇴실을 남깁니다.',
      howTo: '설정에서 기능을 켠 뒤, 회원 상세에서 PIN을 발급하세요.',
    },
  ],
};

/** 공통 — 학부모 안내장 (전 업종) */
const COMMON_NOTICES: FeatureGuideSection = {
  id: 'notices',
  title: '안내장',
  description: '학부모(보호자) 포털에 안내장·가정통신문을 게시합니다.',
  items: [
    {
      id: 'notices',
      title: '안내장 · 가정통신문',
      summary: '전체·반·개별 대상으로 안내를 작성해 포털에 게시합니다.',
      howTo: '작성 후 「포털에 게시」하면 학부모 앱의 안내 탭에 표시됩니다. 문자 발송은 하지 않습니다.',
    },
  ],
};

const PIANO_GUIDE: FeatureGuideSection[] = [
  {
    id: 'customers',
    title: '원생·학부모',
    description: '등록 원생과 보호자 연락처를 관리합니다.',
    items: [
      {
        id: 'students',
        title: '원생 관리',
        summary: '원생 등록, 재원/휴원/퇴원, 담당 강사·반을 관리합니다.',
      },
      {
        id: 'parents',
        title: '학부모 관리',
        summary: '학부모 연락처와 연결된 원생을 관리합니다.',
      },
    ],
  },
  {
    id: 'classes',
    title: '수업·출결',
    description: '반 편성, 시간표, PIN 출입, 보강 수업을 다룹니다.',
    items: [
      {
        id: 'classes',
        title: '반 관리',
        summary: '수업 반(요일·시간·정원·강사)을 만듭니다.',
      },
      {
        id: 'timetable',
        title: '주간 시간표',
        summary: '요일별 수업 일정을 한 화면에서 확인합니다.',
      },
      {
        id: 'attendance',
        title: '출입 관리',
        summary: 'PIN으로 입·퇴실을 기록하고 당일 현황을 봅니다.',
      },
      {
        id: 'makeups',
        title: '보강 수업',
        summary: '결석한 원생의 보강 일정을 잡습니다.',
      },
    ],
  },
  {
    id: 'education',
    title: '교육·일지',
    description: '레슨·연습·상담·교재 자료를 남깁니다.',
    items: [
      {
        id: 'lessons',
        title: '레슨 기록',
        summary: '수업 내용과 피드백을 기록합니다.',
      },
      {
        id: 'practice',
        title: '연습 기록',
        summary: '원생 연습 시간과 내용을 추적합니다.',
      },
      {
        id: 'consultations',
        title: '상담 이력',
        summary: '학부모·원생 상담 내용을 남겨 둡니다.',
      },
      {
        id: 'resources',
        title: '교재 및 곡 관리',
        summary: '교재·곡 자료를 정리합니다.',
      },
    ],
  },
  {
    id: 'billing',
    title: '수납',
    description: '수강료 청구·미납·교재비를 관리합니다.',
    items: [
      {
        id: 'tuition',
        title: '수강료 및 수납',
        summary: '월 수강료 청구서를 만들고 입금을 기록합니다.',
      },
      {
        id: 'unpaid',
        title: '미납 통합 관리',
        summary: '미납 원생을 모아 보고 연락·수납을 이어갑니다.',
      },
      {
        id: 'textbooks',
        title: '교재 판매·재고',
        summary: '교재 판매와 재고를 관리합니다.',
      },
    ],
  },
  {
    id: 'quality',
    title: '교육 품질',
    description: '커리큘럼·과제·시험·리포트로 학습 품질을 봅니다.',
    items: [
      {
        id: 'curriculum',
        title: '커리큘럼·진도',
        summary: '레벨별 커리큘럼과 원생 진도를 관리합니다.',
      },
      {
        id: 'assignments',
        title: '주간 과제',
        summary: '주간 연습 과제를 부여하고 확인합니다.',
      },
      {
        id: 'achievements',
        title: '시험·콩쿠르',
        summary: '시험·콩쿠르 결과를 기록합니다.',
      },
      {
        id: 'reports',
        title: '학습 리포트',
        summary: '학부모에게 전달할 학습 요약을 만듭니다.',
      },
    ],
  },
  {
    id: 'ops',
    title: '학원 운영',
    description: '강사·일정·행사 운영에 사용합니다.',
    items: [
      {
        id: 'teachers',
        title: '강사 관리',
        summary: '강사 정보와 담당 반을 관리합니다.',
      },
      {
        id: 'calendar',
        title: '학원 캘린더',
        summary: '휴강·행사 등 학원 일정을 표시합니다.',
      },
      {
        id: 'recitals',
        title: '연주회·콩쿠르',
        summary: '연주회·콩쿠르 참가와 영상 현황을 관리합니다.',
      },
    ],
  },
  COMMON_NOTICES,
  COMMON_FINANCE,
  COMMON_SETTINGS,
];

const PILATES_GUIDE: FeatureGuideSection[] = [
  {
    id: 'schedule',
    title: '예약·수업',
    description: '회원 예약과 수업 종류를 관리합니다.',
    items: [
      {
        id: 'bookings',
        title: '예약 캘린더',
        summary: '날짜·시간별로 회원 예약을 잡고 상태를 바꿉니다.',
        howTo: '예약 → 날짜 선택 → 회원·수업을 고르면 됩니다.',
      },
      {
        id: 'services',
        title: '수업 종류',
        summary: '그룹·개인 등 수업 상품(시간·가격)을 등록합니다.',
      },
    ],
  },
  {
    id: 'customers',
    title: '회원·강사',
    description: '회원과 강사 정보를 관리합니다.',
    items: [
      {
        id: 'members',
        title: '회원 관리',
        summary: '회원 등록·연락처·상태를 관리합니다.',
      },
      {
        id: 'instructors',
        title: '강사 관리',
        summary: '강사 정보와 담당 수업을 관리합니다.',
      },
      {
        id: 'attendance',
        title: '출입 관리',
        summary: 'PIN으로 입·퇴실을 기록합니다. (설정에서 켠 경우에만)',
      },
    ],
  },
  COMMON_NOTICES,
  COMMON_FINANCE,
  COMMON_SETTINGS,
];

const GYM_GUIDE: FeatureGuideSection[] = [
  buildCustomerSection({
    title: '회원·보호자',
    description: '등록 회원과 보호자 연락처, 수업 레벨을 관리합니다.',
    customerItem: {
      id: 'students',
      title: '회원 관리',
      summary: '회원 등록, 재적/휴원/퇴원, 담당 강사·반·수업 레벨을 관리합니다.',
      howTo: '회원 등록 시 보호자 연락처와 PIN을 함께 설정할 수 있습니다.',
    },
    parentItem: {
      id: 'parents',
      title: '보호자 관리',
      summary: '보호자 연락처와 연결된 회원을 관리합니다.',
    },
  }),
  buildClassesSection({
    title: '수업·출결',
    description: '수업반, 시간표, PIN 출입을 다룹니다.',
    items: [
      {
        id: 'classes',
        title: '수업반 관리',
        summary: '연령·레벨별 수업반(요일·시간·정원·강사)을 만듭니다.',
      },
      {
        id: 'timetable',
        title: '주간 시간표',
        summary: '요일별 수업 일정을 한 화면에서 확인합니다.',
      },
      {
        id: 'attendance',
        title: '출입 관리',
        summary: 'PIN으로 입·퇴실을 기록하고 당일 현황을 봅니다.',
      },
    ],
  }),
  buildBillingSection({
    description: '수강료 청구·미납을 관리합니다.',
    tuitionTitle: '수강료 및 수납',
    tuitionSummary: '월 수강료 청구서를 만들고 입금을 기록합니다.',
    unpaidSummary: '미납 회원을 모아 보고 연락·수납을 이어갑니다.',
  }),
  buildStaffSection({
    title: '지도진',
    description: '강사와 체육관 일정을 관리합니다.',
    teacherTitle: '강사 관리',
    teacherSummary: '강사 정보와 담당 반을 관리합니다.',
    calendarTitle: '체육관 캘린더',
    calendarSummary: '대회·행사·휴관 일정을 기록합니다.',
  }),
  COMMON_NOTICES,
  COMMON_FINANCE,
  COMMON_SETTINGS,
];

const DAYCARE_GUIDE: FeatureGuideSection[] = [
  buildCustomerSection({
    title: '원아·보호자',
    description: '등록 원아와 보호자 연락처, 연령반을 관리합니다.',
    customerItem: {
      id: 'students',
      title: '원아 관리',
      summary: '원아 등록, 재원/휴원/퇴원, 담당 교사·반·연령반을 관리합니다.',
      howTo: '원아 등록 시 보호자 연락처, 알레르기·특이사항, 등하원 PIN을 함께 설정할 수 있습니다.',
    },
    parentItem: {
      id: 'parents',
      title: '보호자 관리',
      summary: '보호자 연락처와 연결된 원아를 관리합니다.',
    },
  }),
  buildClassesSection({
    title: '반·등하원',
    description: '반 편성, 시간표, PIN 등하원을 다룹니다.',
    items: [
      {
        id: 'classes',
        title: '반 관리',
        summary: '연령별 반(요일·시간·정원·교사)을 만듭니다.',
      },
      {
        id: 'timetable',
        title: '주간 시간표',
        summary: '요일별 일과·수업 일정을 한 화면에서 확인합니다.',
      },
      {
        id: 'attendance',
        title: '등·하원 관리',
        summary: 'PIN으로 등원·하원을 기록하고, 알레르기 표시·하원 메모를 남깁니다.',
        howTo: '현황에서 원아별 특이사항을 확인하고, 당일 세션에 하원·전달 메모를 작성할 수 있습니다.',
      },
    ],
  }),
  {
    id: 'care',
    title: '보육 기록',
    description: '알림장·투약·상담으로 보호자와 하루 생활을 공유합니다.',
    items: [
      {
        id: 'journals',
        title: '알림장',
        summary: '원아별 식사·낮잠·활동·건강과 선생님 한마디를 남깁니다.',
        howTo: '날짜를 고른 뒤 원아를 선택해 알림장을 작성합니다. 보호자 포털에서 바로 확인할 수 있습니다.',
      },
      {
        id: 'medications',
        title: '투약 관리',
        summary: '보호자 투약 의뢰를 접수하고 투약 완료를 기록합니다.',
        howTo:
          '원에서 직접 등록하거나, 보호자가 포털에서 의뢰한 건을 확인한 뒤 투약하면 「투약 완료」로 표시합니다.',
      },
      {
        id: 'consultations',
        title: '상담 이력',
        summary: '보호자 상담 내용을 남겨 둡니다.',
      },
      {
        id: 'parent-portal-care',
        title: '보호자 포털 (알림장·투약)',
        summary: '보호자가 앱에서 알림장을 보고 투약 의뢰·등하원·안내장을 확인합니다.',
        howTo:
          '보호자 계정으로 로그인하면 어린이집 전용 메뉴(알림장·투약·안내·등하원·보육료)가 보입니다.',
      },
    ],
  },
  buildBillingSection({
    description: '보육료 청구·미납을 관리합니다.',
    tuitionTitle: '보육료 및 수납',
    tuitionSummary: '월 보육료 청구서를 만들고 입금을 기록합니다.',
    unpaidSummary: '미납 원아를 모아 보고 연락·수납을 이어갑니다.',
  }),
  buildStaffSection({
    title: '보육 인력',
    description: '교사와 원 일정을 관리합니다.',
    teacherTitle: '교사 관리',
    teacherSummary: '교사 정보와 담당 반을 관리합니다.',
    calendarTitle: '원 캘린더',
    calendarSummary: '행사·휴원·체험학습 일정을 기록합니다.',
  }),
  COMMON_NOTICES,
  COMMON_FINANCE,
  COMMON_SETTINGS,
];

const GUIDE_BY_INDUSTRY: Record<IndustryType, FeatureGuideSection[]> = {
  piano: PIANO_GUIDE,
  pilates: PILATES_GUIDE,
  gym: GYM_GUIDE,
  daycare: DAYCARE_GUIDE,
};

const INTRO_BY_INDUSTRY: Record<IndustryType, { title: string; body: string }> = {
  piano: {
    title: '피아노학원 기능 안내',
    body: '원생·수업·수납·교육 기록을 중심으로 학원을 운영하는 메뉴입니다. 아래에서 각 기능이 무엇을 하는지 확인해 보세요.',
  },
  pilates: {
    title: '필라테스 스튜디오 기능 안내',
    body: '회원 예약·수업 종류·강사·재무를 중심으로 스튜디오를 운영하는 메뉴입니다. 아래에서 각 기능이 무엇을 하는지 확인해 보세요.',
  },
  gym: {
    title: '체육관 기능 안내',
    body: '회원·수업반·출결·수강료를 중심으로 체육관을 운영하는 메뉴입니다. 아래에서 각 기능이 무엇을 하는지 확인해 보세요.',
  },
  daycare: {
    title: '어린이집 기능 안내',
    body: '원아·연령반·등하원·알림장·투약·가정통신문·보육료를 중심으로 어린이집을 운영하는 메뉴입니다. 아래에서 각 기능이 무엇을 하는지 확인해 보세요.',
  },
};

export function getIndustryFeatureGuide(industry: IndustryType | string | null | undefined): {
  intro: { title: string; body: string };
  sections: FeatureGuideSection[];
} {
  const type = normalizeIndustryType(industry);
  return {
    intro: INTRO_BY_INDUSTRY[type],
    sections: GUIDE_BY_INDUSTRY[type],
  };
}
