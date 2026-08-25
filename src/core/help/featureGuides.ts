import type { IndustryType } from '@/core/industry/types';

export interface FeatureGuideItem {
  id: string;
  title: string;
  summary: string;
  howTo?: string;
}

export interface FeatureGuideSection {
  id: string;
  title: string;
  description: string;
  items: FeatureGuideItem[];
}

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
  COMMON_FINANCE,
  COMMON_SETTINGS,
];

const GUIDE_BY_INDUSTRY: Record<IndustryType, FeatureGuideSection[]> = {
  piano: PIANO_GUIDE,
  pilates: PILATES_GUIDE,
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
};

export function getIndustryFeatureGuide(industry: IndustryType | string | null | undefined): {
  intro: { title: string; body: string };
  sections: FeatureGuideSection[];
} {
  const type = industry === 'pilates' ? 'pilates' : 'piano';
  return {
    intro: INTRO_BY_INDUSTRY[type],
    sections: GUIDE_BY_INDUSTRY[type],
  };
}
