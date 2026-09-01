import type { IndustryType } from '@/core/industry/types';
import type { OwnerGuideWorkflowStep } from './types';

/** 업종별 핵심 업무 흐름: 등록 → 상담/설정 → 일정 → 출결 → 수납·보육 */
export const OWNER_GUIDE_WORKFLOW: Record<IndustryType, OwnerGuideWorkflowStep[]> = {
  piano: [
    {
      id: 'wf-register',
      tab: 'students',
      title: '원생 등록',
      benefit: '신규 원생과 보호자 연락처, 수강 정보를 한곳에 모읍니다.',
      tip: '학부모를 연결하면 포털에서 출결·안내를 확인할 수 있습니다.',
    },
    {
      id: 'wf-consult',
      tab: 'consultations',
      title: '상담 기록',
      benefit: '입학·레슨 상담 내용을 남겨 이후 관리와 소통에 활용합니다.',
    },
    {
      id: 'wf-schedule',
      tab: 'classes',
      title: '반·일정 편성',
      benefit: '요일·시간·강사가 정해진 반을 만들고 주간 시간표를 확인합니다.',
    },
    {
      id: 'wf-attendance',
      tab: 'attendance',
      title: '출결·출입',
      benefit: 'PIN으로 입·퇴실을 기록하고 당일 출석 현황을 바로 봅니다.',
    },
    {
      id: 'wf-billing',
      tab: 'tuition',
      title: '수강료 수납',
      benefit: '월 청구서를 만들고 입금·미납을 한 화면에서 관리합니다.',
    },
  ],
  pilates: [
    {
      id: 'wf-register',
      tab: 'members',
      title: '회원 등록',
      benefit: '회원 정보와 연락처를 등록해 예약·출입 관리의 기준을 만듭니다.',
    },
    {
      id: 'wf-services',
      tab: 'services',
      title: '수업 종류 설정',
      benefit: '개인·그룹 등 수업 상품과 시간·요금을 등록합니다.',
      tip: '수업 종류를 먼저 등록해야 예약을 잡을 수 있습니다.',
    },
    {
      id: 'wf-schedule',
      tab: 'bookings',
      title: '예약 관리',
      benefit: '날짜·시간별 회원 예약을 잡고 확정·취소 상태를 관리합니다.',
    },
    {
      id: 'wf-attendance',
      tab: 'attendance',
      title: '출입 기록',
      benefit: 'PIN으로 입·퇴실을 기록해 당일 이용 현황을 확인합니다.',
    },
    {
      id: 'wf-notices',
      tab: 'notices',
      title: '회원 안내',
      benefit: '안내장을 작성해 보호자 포털에 바로 게시합니다.',
    },
  ],
  gym: [
    {
      id: 'wf-register',
      tab: 'students',
      title: '회원 등록',
      benefit: '회원·보호자 정보와 수업 레벨, PIN을 한번에 설정합니다.',
    },
    {
      id: 'wf-schedule',
      tab: 'classes',
      title: '수업반 개설',
      benefit: '연령·레벨별 수업반과 요일·시간표를 편성합니다.',
    },
    {
      id: 'wf-attendance',
      tab: 'attendance',
      title: '출입·출결',
      benefit: '입실 기록과 당일 출입 현황을 실시간으로 확인합니다.',
    },
    {
      id: 'wf-billing',
      tab: 'tuition',
      title: '수강료 수납',
      benefit: '월 수강료 청구서를 만들고 입금·미납을 추적합니다.',
    },
  ],
  daycare: [
    {
      id: 'wf-register',
      tab: 'students',
      title: '원아 등록',
      benefit: '원아·보호자 정보와 연령반, 등하원 PIN을 설정합니다.',
    },
    {
      id: 'wf-consult',
      tab: 'consultations',
      title: '상담 기록',
      benefit: '입소·보육 상담 내용을 남겨 보호자와의 소통에 활용합니다.',
    },
    {
      id: 'wf-schedule',
      tab: 'classes',
      title: '반·일정',
      benefit: '연령반과 일과 시간표를 편성해 교사·원아를 배정합니다.',
    },
    {
      id: 'wf-attendance',
      tab: 'attendance',
      title: '등·하원',
      benefit: '등원·하원을 기록하고 전달 메모·특이사항을 남깁니다.',
    },
    {
      id: 'wf-care',
      tab: 'journals',
      title: '알림장·보육',
      benefit: '식사·낮잠·활동을 기록해 보호자 포털에 바로 공유합니다.',
    },
    {
      id: 'wf-billing',
      tab: 'tuition',
      title: '보육료 수납',
      benefit: '월 보육료 청구와 입금·미납을 관리합니다.',
    },
  ],
};
