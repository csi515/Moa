import React from 'react';
import { StorageService } from '@/services/storage';
import type { Student } from '@/types';
import { CheckCircle2 } from 'lucide-react';
import { Section } from './shared';

export function ParentAssignmentsView({
  student,
  readOnly = false,
  showToast,
  onRefresh,
}: {
  student: Student;
  readOnly?: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onRefresh: () => void;
}) {
  const assignments = StorageService.getWeeklyAssignments(student.id);

  const handleConfirm = (assignmentId: string, itemId: string) => {
    StorageService.confirmAssignmentItem(assignmentId, itemId);
    showToast('과제 완료를 확인했습니다.', 'success');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <Section title="주간 과제">
          <p className="text-sm text-slate-400 text-center py-6">등록된 과제가 없습니다.</p>
        </Section>
      ) : (
        assignments.map((a) => (
          <Section key={a.id} title={a.title || `${a.weekStart} 주 과제`}>
            {a.teacherNotes && <p className="text-xs text-slate-500 mb-2">{a.teacherNotes}</p>}
            {a.items.map((it) => (
              <div key={it.id} className="bg-slate-50 rounded-xl p-3 mb-2">
                <p className="font-bold text-sm">{it.songTitle}</p>
                <p className="text-xs text-slate-600 mt-1">{it.instructions}</p>
                {it.targetMinutes && (
                  <p className="text-xs text-indigo-600 mt-1">목표 연습: {it.targetMinutes}분/일</p>
                )}
                {it.parentConfirmed ? (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 확인 완료
                  </p>
                ) : readOnly ? (
                  <p className="text-xs text-slate-500 mt-2">퇴원·졸업 기록은 확인만 가능합니다.</p>
                ) : (
                  <button
                    onClick={() => handleConfirm(a.id, it.id)}
                    className="mt-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                  >
                    연습 완료 확인
                  </button>
                )}
              </div>
            ))}
          </Section>
        ))
      )}

      <Section title="레슨 과제 메모">
        {StorageService.getLessonRecords()
          .filter((l) => l.studentId === student.id && l.homework)
          .slice(0, 5)
          .map((l) => (
            <div key={l.id} className="py-2 border-b border-slate-50 text-sm">
              <p className="text-xs text-slate-400">{l.date}</p>
              <p>{l.homework}</p>
            </div>
          ))}
      </Section>
    </div>
  );
}
