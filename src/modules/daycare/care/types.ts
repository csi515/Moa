/** 어린이집 알림장 */
export type CareJournalMood = 'good' | 'normal' | 'tired' | 'sick';

export interface CareJournal {
  id: string;
  studentId: string;
  studentName: string;
  journalDate: string; // YYYY-MM-DD
  mood: CareJournalMood;
  meals: string;
  nap: string;
  activities: string;
  bowel?: string;
  healthNote?: string;
  teacherNote: string;
  teacherId?: string;
  teacherName?: string;
  createdAt: string;
  updatedAt: string;
}

/** 투약 의뢰 상태 */
export type MedicationStatus = 'requested' | 'administered' | 'cancelled';

export interface MedicationRequest {
  id: string;
  studentId: string;
  studentName: string;
  requestDate: string; // YYYY-MM-DD
  medicineName: string;
  dosage: string;
  times: string;
  reason: string;
  guardianName?: string;
  status: MedicationStatus;
  administeredAt?: string;
  administeredBy?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export const CARE_JOURNAL_MOOD_LABEL: Record<CareJournalMood, string> = {
  good: '좋음',
  normal: '보통',
  tired: '피곤',
  sick: '아픔',
};

export const MEDICATION_STATUS_LABEL: Record<MedicationStatus, string> = {
  requested: '투약 대기',
  administered: '투약 완료',
  cancelled: '취소',
};
