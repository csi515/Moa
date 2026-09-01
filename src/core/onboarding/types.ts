import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';

/** 실제 업무 흐름 안내 단계 */
export interface OwnerGuideWorkflowStep {
  id: string;
  tab: NavTab;
  title: string;
  /** 이 기능으로 무엇을 할 수 있는지 */
  benefit: string;
  tip?: string;
}

export interface OwnerGuideStepStatus extends OwnerGuideWorkflowStep {
  stepNumber: number;
  completed: boolean;
}

export interface OwnerGuideSettings {
  wizardCompleted?: boolean;
  wizardSkipped?: boolean;
}

export type OwnerGuideIndustry = IndustryType;
