import React from 'react';
import {
  User,
  BookOpen,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Piano,
  Video,
  FileText,
  Award,
} from 'lucide-react';

export type DetailTab =
  | 'info'
  | 'classes'
  | 'attendance'
  | 'tuition'
  | 'textbooks'
  | 'consultations'
  | 'practice'
  | 'videos'
  | 'achievements'
  | 'memo';

export interface DetailTabCounts {
  enrolledClasses: number;
  attRate: number;
  invoiceCount: number;
  salesCount: number;
  consultationCount: number;
  practiceCount: number;
  videoCount: number;
  competitionCount: number;
}

export interface DetailTabConfigItem {
  id: DetailTab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const iconClass = 'w-3.5 h-3.5';

export function getDetailTabConfig(counts: DetailTabCounts): DetailTabConfigItem[] {
  return [
    { id: 'info', label: '기본정보', shortLabel: '기본', icon: React.createElement(User, { className: iconClass }) },
    {
      id: 'classes',
      label: `수업 (${counts.enrolledClasses})`,
      shortLabel: `수업 (${counts.enrolledClasses})`,
      icon: React.createElement(BookOpen, { className: iconClass }),
    },
    {
      id: 'attendance',
      label: `출결 (${counts.attRate}%)`,
      shortLabel: `출결 (${counts.attRate}%)`,
      icon: React.createElement(CheckCircle2, { className: iconClass }),
    },
    {
      id: 'tuition',
      label: `수강료 (${counts.invoiceCount})`,
      shortLabel: `수강료 (${counts.invoiceCount})`,
      icon: React.createElement(CreditCard, { className: iconClass }),
    },
    {
      id: 'textbooks',
      label: `교재 구매 (${counts.salesCount})`,
      shortLabel: `교재 (${counts.salesCount})`,
      icon: React.createElement(BookOpen, { className: iconClass }),
    },
    {
      id: 'consultations',
      label: `상담 (${counts.consultationCount})`,
      shortLabel: `상담 (${counts.consultationCount})`,
      icon: React.createElement(MessageSquare, { className: iconClass }),
    },
    {
      id: 'practice',
      label: `연습/레슨 (${counts.practiceCount})`,
      shortLabel: `연습 (${counts.practiceCount})`,
      icon: React.createElement(Piano, { className: iconClass }),
    },
    {
      id: 'videos',
      label: `연주영상 (${counts.videoCount})`,
      shortLabel: `영상 (${counts.videoCount})`,
      icon: React.createElement(Video, { className: iconClass }),
    },
    {
      id: 'achievements',
      label: `콩쿨 수상 (${counts.competitionCount})`,
      shortLabel: `수상 (${counts.competitionCount})`,
      icon: React.createElement(Award, { className: iconClass }),
    },
    {
      id: 'memo',
      label: '메모/특이사항',
      shortLabel: '메모',
      icon: React.createElement(FileText, { className: iconClass }),
    },
  ];
}
