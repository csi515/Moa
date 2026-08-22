import React from 'react';
import { RecitalService } from '@/modules/piano/services/recitalService';
import type { Student } from '@/types';
import { Section } from './shared';

export function ParentEventsView({ student }: { student: Student }) {
  const events = RecitalService.getRecitalEvents().filter((e) =>
    (e.participantIds || []).includes(student.id)
  );

  return (
    <Section title="연주회·콩쿠르 일정">
      {events.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">예정된 행사가 없습니다.</p>
      ) : (
        events.map((ev) => (
          <div key={ev.id} className="py-3 border-b border-slate-50">
            <p className="font-bold text-sm">{ev.title}</p>
            <p className="text-xs text-slate-500 mt-1">{ev.startDate} · {ev.type === 'competition' ? '콩쿠르' : '연주회'}</p>
            {ev.description && <p className="text-xs text-slate-400 mt-1">{ev.description}</p>}
          </div>
        ))
      )}
    </Section>
  );
}
