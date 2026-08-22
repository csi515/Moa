import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { Student } from '@/types';
import { formatCurrency, formatPhone } from '@/utils/formatters';
import { CombinedPaymentModal } from '../tuition/CombinedPaymentModal';
import {
  AlertCircle,
  CreditCard,
  BookOpen,
  Search,
  Download,
  Phone,
  ChevronRight,
} from 'lucide-react';

export const UnpaidManagementView: React.FC = () => {
  const { setSelectedStudentId, setActiveTab, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'overdue'>('all');
  const [payStudent, setPayStudent] = useState<Student | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = StorageService.subscribe(() => setRefreshKey((k) => k + 1));
    return unsub;
  }, []);

  const stats = StorageService.getUnifiedUnpaidStats();
  const summaries = StorageService.getUnifiedUnpaidSummaries();

  const filtered = useMemo(() => {
    return summaries.filter((s) => {
      if (filterMode === 'overdue' && s.overdueCount === 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.studentName.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q) ||
          s.parentPhone.includes(q)
        );
      }
      return true;
    });
  }, [summaries, filterMode, searchQuery, refreshKey]);

  const handleExportCsv = () => {
    const header = '원생명,학부모,연락처,수강료미납,교재비미납,합계,연체건수\n';
    const rows = filtered
      .map(
        (s) =>
          `${s.studentName},${s.parentName},${s.parentPhone},${s.tuitionUnpaid},${s.textbookUnpaid},${s.totalUnpaid},${s.overdueCount}`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `미납명단_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('미납 명단 CSV가 다운로드되었습니다.', 'success');
  };

  const openPayment = (studentId: string) => {
    const st = StorageService.getStudentById(studentId);
    if (st) setPayStudent(st);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            미납 통합 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            수강료·교재비 미납을 원생별로 한눈에 확인하고 수납 처리합니다
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 self-start"
        >
          <Download className="w-4 h-4" />
          CSV 내보내기
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500">미납 원생</p>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.studentCount}명</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
          <p className="text-xs text-rose-700 font-semibold">총 미납액</p>
          <p className="text-xl font-black text-rose-900 mt-1">{formatCurrency(stats.grandTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500">수강료 미납</p>
          <p className="text-lg font-black text-indigo-700 mt-1">{formatCurrency(stats.tuitionTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500">교재비 미납</p>
          <p className="text-lg font-black text-amber-700 mt-1">{formatCurrency(stats.textbookTotal)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            전체 미납
          </button>
          <button
            onClick={() => setFilterMode('overdue')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filterMode === 'overdue' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            연체 ({stats.overdueStudents}명)
          </button>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="원생명, 학부모, 연락처 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <p className="font-bold text-emerald-600">🎉 미납 내역이 없습니다!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.studentId}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedStudentId(s.studentId);
                        setActiveTab('students');
                      }}
                      className="font-bold text-slate-900 hover:text-indigo-600 text-sm"
                    >
                      {s.studentName}
                    </button>
                    {s.overdueCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                        연체 {s.overdueCount}건 · {s.oldestOverdueDays}일
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {s.parentName} · {formatPhone(s.parentPhone)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-black text-rose-600">{formatCurrency(s.totalUnpaid)}</p>
                    <p className="text-[11px] text-slate-400">
                      수강료 {formatCurrency(s.tuitionUnpaid)} + 교재 {formatCurrency(s.textbookUnpaid)}
                    </p>
                  </div>
                  <button
                    onClick={() => openPayment(s.studentId)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                  >
                    통합 수납
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {s.tuitionItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-indigo-700 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> 수강료
                    </p>
                    {s.tuitionItems.map((inv) => (
                      <div key={inv.id} className="flex justify-between text-slate-600 pl-5">
                        <span>{inv.yearMonth} (기한 {inv.dueDate.slice(5)})</span>
                        <span className="font-bold text-rose-600">{formatCurrency(inv.unpaidAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {s.textbookItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-amber-700 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> 교재비
                    </p>
                    {s.textbookItems.map((sale) => (
                      <div key={sale.id} className="flex justify-between text-slate-600 pl-5">
                        <span>{sale.textbookTitle}</span>
                        <span className="font-bold text-rose-600">{formatCurrency(sale.unpaidAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {s.parentPhone && (
                <a
                  href={`tel:${s.parentPhone}`}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold hover:underline"
                >
                  <Phone className="w-3 h-3" /> 전화 연결
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {payStudent && (
        <CombinedPaymentModal
          student={payStudent}
          onSuccess={() => setPayStudent(null)}
          onClose={() => setPayStudent(null)}
        />
      )}
    </div>
  );
};
