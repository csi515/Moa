import { normalizeIndustryType, type IndustryType } from '@/core/industry/types';
import {
  buildBillingSection,
  buildClassesSection,
  buildCustomerSection,
  buildGuideSection,
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
      howTo:
        '작성 후 「포털에 게시」하면 학부모 앱의 안내 탭에 표시됩니다. 알림은 앱 푸시로만 전달되며 카카오·문자는 보내지 않습니다.',
    },
  ],
};

const PIANO_GUIDE: FeatureGuideSection[] = [
  buildGuideSection({
    id: 'home',
    title: '홈',
    description: '오늘 일정·출결·상담·미납을 빠르게 확인합니다.',
    items: [
      {
        id: 'dashboard',
        title: '홈',
        summary: '오늘 필요한 업무 요약과 바로가기를 봅니다.',
      },
    ],
  }),
  buildCustomerSection({
    title: '학생',
    description: '등록 학생과 보호자 연락처를 관리합니다.',
    customerItem: {
      id: 'students',
      title: '학생 관리',
      summary: '학생 등록, 재원/휴원/퇴원, 담당 강사·반을 관리합니다.',
    },
    parentItem: {
      id: 'parents',
      title: '학부모 관리',
      summary: '학부모 연락처와 연결된 학생을 관리합니다.',
    },
  }),
  buildGuideSection({
    id: 'schedule',
    title: '일정',
    description: '수업 시간표·반·캘린더·커리큘럼을 관리합니다.',
    items: [
      {
        id: 'timetable',
        title: '주간 시간표',
        summary: '요일별 수업 일정을 한 화면에서 확인합니다.',
      },
      {
        id: 'classes',
        title: '반/수업 관리',
        summary: '수업 반(요일·시간·정원·강사)을 만듭니다.',
      },
      {
        id: 'calendar',
        title: '학원 캘린더',
        summary: '휴강·행사 등 학원 일정을 표시합니다.',
      },
      {
        id: 'curriculum',
        title: '커리큘럼·진도',
        summary: '레벨별 커리큘럼과 학생 진도를 관리합니다.',
      },
    ],
  }),
  buildGuideSection({
    id: 'attendance',
    title: '수업',
    description: '출입·오늘 레슨·보강을 처리합니다.',
    items: [
      {
        id: 'attendance',
        title: '출입 관리',
        summary: 'PIN으로 입·퇴실을 기록하고 당일 현황을 봅니다.',
      },
      {
        id: 'lessons',
        title: '오늘 레슨',
        summary: '출석·레슨 노트·과제를 한 화면에서 저장합니다.',
        howTo: '오늘 수업 원생을 선택한 뒤 출석과 레슨 내용을 작성하면 학부모 과제에 자동 반영됩니다.',
      },
      {
        id: 'assignments',
        title: '주간 과제',
        summary: '원생별 주간 연습 과제를 관리합니다.',
      },
      {
        id: 'makeups',
        title: '보강 수업',
        summary: '결석한 학생의 보강 일정을 시간·연습실·강사와 함께 잡습니다.',
        howTo:
          '일정 등록 시 강사·연습실 충돌이 있으면 확인 후 저장할 수 있습니다. 등록 즉시 학부모 포털 알림과 앱 푸시가 전달됩니다.',
      },
    ],
  }),
  buildGuideSection({
    id: 'consultation',
    title: '상담',
    description: '상담 예약·기록·가능 시간을 관리합니다.',
    items: [
      {
        id: 'consultations',
        title: '상담',
        summary: '예약 관리, 상담 기록, 상담 가능 시간을 한곳에서 처리합니다.',
        howTo: '가능시간 설정 → 예약 슬롯 동기화 → 공개 페이지에서 학부모가 신청 → 예약 관리에서 확정',
      },
    ],
  }),
  buildBillingSection({
    description: '수강료 청구와 미납을 관리합니다.',
    tuitionTitle: '수강료 및 수납',
    tuitionSummary: '월 수강료 청구서를 만들고 입금을 기록합니다.',
    unpaidSummary: '미납 학생을 모아 보고 연락·수납을 이어갑니다.',
  }),
  buildGuideSection({
    id: 'extras',
    title: '추가 기능',
    description: '자주 쓰지 않는 운영·교육 메뉴입니다. 사이드바 하단에서 열 수 있습니다.',
    items: [
      {
        id: 'practice',
        title: '연습 기록',
        summary: '학생·학부모가 남긴 연습 시간과 내용을 확인하고 피드백합니다.',
        howTo: '학부모가 앱에서 연습 일지를 올리면 여기서 확인·평가할 수 있습니다.',
      },
      {
        id: 'textbooks',
        title: '교재 판매',
        summary: '교재 판매와 재고를 관리합니다.',
      },
      {
        id: 'resources',
        title: '교재·곡 자료',
        summary: '교재·곡 자료를 정리합니다.',
      },
      {
        id: 'recitals',
        title: '연주회·콩쿠르',
        summary: '연주회·콩쿠르 참가와 영상 현황을 관리합니다.',
      },
      {
        id: 'achievements',
        title: '시험·등급',
        summary: '급수·콩쿠르·시험 결과를 학생별로 기록합니다.',
      },
      {
        id: 'reports',
        title: '학습 리포트',
        summary: '월간 학습 리포트를 작성해 학부모 포털에 게시합니다.',
        howTo: '게시하면 학부모 홈·리포트 탭에서 확인할 수 있습니다.',
      },
      {
        id: 'teachers',
        title: '선생님 관리',
        summary: '강사 정보와 담당 반을 관리합니다.',
      },
      {
        id: 'enrollment-requests',
        title: '등록 요청',
        summary: '학부모가 앱에서 보낸 원생 등록 요청을 승인합니다.',
      },
    ],
  }),
  buildGuideSection({
    id: 'parent-portal-piano',
    title: '학부모 포털',
    description: '학부모가 앱에서 과제·진도·연습·안내를 확인합니다. 알림은 앱 푸시만 사용합니다.',
    items: [
      {
        id: 'parent-home',
        title: '홈·과제·진도',
        summary: '레슨 피드백, 주간 과제, 진도·연습 일지, 학습 리포트를 봅니다.',
        howTo: '하단 메뉴와 홈 바로가기로 과제·진도·리포트로 이동합니다.',
      },
      {
        id: 'parent-push',
        title: '앱 푸시 알림',
        summary: '보강·결석·미납 등 중요 안내는 앱 푸시로만 전달됩니다.',
        howTo: '카카오 알림톡·문자는 보내지 않습니다. 네이티브 앱에서 알림 권한을 허용하면 푸시를 받습니다.',
      },
    ],
  }),
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
    title: '수업·출결·차량',
    description: '수업반, 시간표, PIN 출입, 차량 운행을 다룹니다.',
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
      {
        id: 'shuttle',
        title: '차량 운행',
        summary: '학부모 차량 운행 신청을 확인하고 픽업·하원 운행을 확정·완료합니다.',
        howTo:
          '회원에 셔틀 주소가 있으면 신청 시 자동으로 채워집니다. 학부모 포털의 「차량」 메뉴에서도 신청할 수 있습니다.',
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

const GUIDE_BY_INDUSTRY: Partial<Record<IndustryType, FeatureGuideSection[]>> = {
  piano: PIANO_GUIDE,
  pilates: PILATES_GUIDE,
  gym: GYM_GUIDE,
  daycare: DAYCARE_GUIDE,
};

const INTRO_BY_INDUSTRY: Partial<Record<IndustryType, { title: string; body: string }>> = {
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
    body: '회원·수업반·출결·차량 운행·수강료를 중심으로 체육관을 운영하는 메뉴입니다. 아래에서 각 기능이 무엇을 하는지 확인해 보세요.',
  },
  daycare: {
    title: '어린이집 기능 안내',
    body: '원아·연령반·등하원·알림장·투약·가정통신문·보육료를 중심으로 어린이집을 운영하는 메뉴입니다. 아래에서 각 기능이 무엇을 하는지 확인해 보세요.',
  },
};

const GENERIC_INTRO = {
  title: '사업장 기능 안내',
  body: '설정·계정 등 공통 기능을 사용할 수 있습니다. 업종 전용 업무 기능은 순차적으로 제공됩니다.',
};

const GENERIC_GUIDE: FeatureGuideSection[] = [COMMON_SETTINGS];

export function getIndustryFeatureGuide(industry: IndustryType | string | null | undefined): {
  intro: { title: string; body: string };
  sections: FeatureGuideSection[];
} {
  const type = normalizeIndustryType(industry);
  return {
    intro: INTRO_BY_INDUSTRY[type] ?? GENERIC_INTRO,
    sections: GUIDE_BY_INDUSTRY[type] ?? GENERIC_GUIDE,
  };
}
