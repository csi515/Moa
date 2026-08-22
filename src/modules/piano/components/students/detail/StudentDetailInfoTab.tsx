import React from 'react';
import { Student } from '@/types';
import { CustomerPinPanel } from '@/core/attendance';
import { formatGuardianRelationship } from '@/core/parent';
import type { GuardianInfo } from '@/core/parent/types';
import { formatCurrency, formatPhone, getLevelColor } from '@/utils/formatters';
import { Award, Link2 } from 'lucide-react';

interface StudentDetailInfoTabProps {
  student: Student;
  guardians: GuardianInfo[];
  totalPracticeMinutes: number;
  attendanceEnabled: boolean;
  isAdmin: boolean;
  isSupabaseConfigured: boolean;
  onEdit: (student: Student) => void;
  onOpenGuardianLink: () => void;
}

export const StudentDetailInfoTab: React.FC<StudentDetailInfoTabProps> = ({
  student,
  guardians,
  totalPracticeMinutes,
  attendanceEnabled,
  isAdmin,
  isSupabaseConfigured,
  onEdit,
  onOpenGuardianLink,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        원생 및 학부모 상세
      </h4>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
          <span className="text-slate-500">원생 번호</span>
          <span className="font-mono font-bold text-slate-800">{student.studentNumber}</span>
        </div>
        <div className="py-1.5 border-b border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500">보호자 ({guardians.length}명)</span>
            <div className="flex items-center gap-2">
              {isAdmin && isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={onOpenGuardianLink}
                  className="text-[10px] font-bold text-indigo-600 hover:underline min-h-[44px] px-2 flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" />
                  연결 코드
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(student)}
                className="text-[10px] font-bold text-indigo-600 hover:underline min-h-[44px] px-2"
              >
                보호자 추가/수정
              </button>
            </div>
          </div>
          {guardians.length === 0 ? (
            <span className="text-slate-400">등록된 보호자 없음</span>
          ) : (
            <div className="space-y-2">
              {guardians.map((g) => (
                <div
                  key={g.parentId}
                  className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 border border-slate-100"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{g.parentName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                        {formatGuardianRelationship(g.relationship)}
                      </span>
                      {g.isPrimary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                          주
                        </span>
                      )}
                    </div>
                    {g.parentEmail && (
                      <span className="text-[11px] text-slate-500">{g.parentEmail}</span>
                    )}
                  </div>
                  {g.parentPhone && (
                    <a
                      href={`tel:${g.parentPhone}`}
                      className="font-mono text-xs font-bold text-indigo-600 hover:underline shrink-0"
                    >
                      {formatPhone(g.parentPhone)}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {student.emergencyContact && (
          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
            <span className="text-slate-500">비상 연락처</span>
            <a href={`tel:${student.emergencyContact}`} className="font-mono text-slate-700">
              {formatPhone(student.emergencyContact)}
            </a>
          </div>
        )}
        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
          <span className="text-slate-500">주소</span>
          <span className="text-slate-800 text-right max-w-xs">{student.address || '-'}</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-slate-500">입학 등록일</span>
          <span className="text-slate-800 font-medium">{student.joinDate}</span>
        </div>
      </div>
    </div>

    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        수강 및 수납 설정
      </h4>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
          <span className="text-slate-500">담당 선생님</span>
          <span className="font-bold text-slate-800">{student.teacherName}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
          <span className="text-slate-500">피아노 과정/레벨</span>
          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${getLevelColor(student.level)}`}>
            {student.level}
          </span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
          <span className="text-slate-500">월 정규 수강료</span>
          <span className="font-bold text-indigo-700 text-sm">{formatCurrency(student.tuitionFee)}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
          <span className="text-slate-500">정기 수납일</span>
          <span className="font-bold text-slate-800">매월 {student.paymentDay}일</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-slate-500">총 누적 연습시간</span>
          <span className="font-bold text-emerald-700">
            {totalPracticeMinutes}분 ({Math.round(totalPracticeMinutes / 60)}시간)
          </span>
        </div>
      </div>
    </div>

    {attendanceEnabled && (
      <div className="md:col-span-2">
        <CustomerPinPanel student={student} />
      </div>
    )}

    {student.specialNotes && (
      <div className="md:col-span-2 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
        <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-600" />
          원생 특이사항
        </p>
        <p className="text-xs text-amber-900 leading-relaxed">{student.specialNotes}</p>
      </div>
    )}
  </div>
);
