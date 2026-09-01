import React from 'react';
import { Clock, ArrowRight, BookOpen, Package, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import type { NavTab } from '@/context/AppContext';
import type { Student, Textbook, TuitionInvoice } from '@/types';
import type { PianoDashboardWidgetId } from '@/core/dashboard';

import type { PianoDashboardStats, PianoTextbookStats, PianoTextbookSale } from './dashboardTypes';

interface DashboardPanelsSectionProps {
  stats: PianoDashboardStats;
  students: Student[];
  recentInvoices: TuitionInvoice[];
  tbStats: PianoTextbookStats;
  recentSales: PianoTextbookSale[];
  lowStockBooks: Textbook[];
  currentMonthLabel: string;
  isVisible: (id: PianoDashboardWidgetId) => boolean;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPanelsSection: React.FC<DashboardPanelsSectionProps> = ({
  stats,
  students,
  recentInvoices,
  tbStats,
  recentSales,
  lowStockBooks,
  currentMonthLabel,
  isVisible,
  onNavigate,
}) => {
  const showSchedule = isVisible('panel_today_schedule');
  const showUnpaid = isVisible('panel_unpaid_list');
  const showTextbook = isVisible('panel_textbook_sales');
  const showLowStock = isVisible('panel_low_stock');

  const topRowVisible = showSchedule || showUnpaid;
  const bottomRowVisible = showTextbook || showLowStock;

  if (!topRowVisible && !bottomRowVisible) return null;

  return (
    <div className="space-y-6">
      {topRowVisible && (
        <div className={`grid grid-cols-1 gap-6 ${showSchedule && showUnpaid ? 'lg:grid-cols-3' : ''}`}>
          {showSchedule && (
            <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${showUnpaid ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">
                    오늘의 수업 일정 ({stats.todayClasses.length}개 반)
                  </h4>
                </div>
                <button type="button" onClick={() => onNavigate('timetable')} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                  주간 시간표 보기 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.todayClasses.length === 0 ? (
                  <p className="text-xs text-slate-400 p-6 text-center col-span-full">오늘 예정된 정규 수업이 없습니다.</p>
                ) : (
                  stats.todayClasses.map((cls, idx) => {
                    const enrolled = students.filter((s) => s.status === 'active' && s.classIds.includes(cls.id));
                    const isFull = enrolled.length >= cls.capacity;
                    const isCurrent = idx === 0;
                    return (
                      <div
                        key={cls.id}
                        className={`p-4 border rounded-xl flex flex-col gap-2 ${isCurrent ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 ring-offset-2' : 'border-slate-100 bg-slate-50'}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                            {cls.startTime} - {cls.endTime}
                          </span>
                          <span className="text-xs text-slate-400">{cls.teacherName}</span>
                        </div>
                        <p className={`text-sm font-bold ${isCurrent ? 'text-indigo-950' : 'text-slate-800'}`}>{cls.name}</p>
                        <div className="flex items-center justify-between mt-1 text-xs">
                          <span className="text-slate-500">
                            정원: {enrolled.length}/{cls.capacity}명 {isFull && <span className="text-rose-500 font-bold">(만석)</span>}
                          </span>
                          <button type="button" onClick={() => onNavigate('attendance')} className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-slate-200'}`}>
                            출결
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {showUnpaid && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 text-base">미납 수강료 현황</h4>
                  <button type="button" onClick={() => onNavigate('unpaid')} className="text-xs text-indigo-600 font-semibold hover:underline">전체보기</button>
                </div>
                <div className="space-y-3">
                  {recentInvoices.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">미납된 수강료가 없습니다. ✨</p>
                  ) : (
                    recentInvoices.map((inv, i) => (
                      <div key={inv.id} className={`flex items-center justify-between p-3 rounded-xl border ${i === 0 ? 'bg-rose-50 border-rose-100' : 'hover:bg-slate-50 border-transparent'}`}>
                        <div>
                          <p className="text-sm font-bold">{inv.studentName}</p>
                          <p className="text-xs text-slate-400">수납예정일: {inv.dueDate.slice(5)}</p>
                        </div>
                        <p className="text-sm font-bold font-mono">{formatCurrency(inv.unpaidAmount)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button type="button" onClick={() => onNavigate('unpaid')} className="w-full py-2.5 mt-4 text-xs font-semibold text-slate-500 bg-slate-50 rounded-lg hover:text-indigo-600 border border-slate-200/80 min-h-[44px]">
                미납 통합 관리로 이동
              </button>
            </div>
          )}
        </div>
      )}

      {bottomRowVisible && (
        <div className={`grid grid-cols-1 gap-6 ${showTextbook && showLowStock ? 'lg:grid-cols-3' : ''}`}>
          {showTextbook && (
            <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${showLowStock ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">교재 판매 및 교재비 수납 현황</h4>
                    <p className="text-xs text-slate-400">수강료와 분리되어 관리되는 교재 판매 내역</p>
                  </div>
                </div>
                <button type="button" onClick={() => onNavigate('textbooks')} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                  교재 관리 전체 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl mb-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">{currentMonthLabel} 판매 총액</span>
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(tbStats.totalSalesAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">교재비 수납액</span>
                  <span className="font-bold text-emerald-600 text-sm">{formatCurrency(tbStats.totalPaidAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">교재비 미납액</span>
                  <span className="font-black text-rose-600 text-sm">{formatCurrency(tbStats.totalUnpaidAmount)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-700">최근 교재 판매 이력</h5>
                {recentSales.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">등록된 교재 판매 내역이 없습니다.</p>
                ) : (
                  recentSales.map((sale) => (
                    <div key={sale.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{sale.studentName}</span>
                        <span className="text-slate-400"> ({sale.textbookTitle})</span>
                      </div>
                      <span className="font-bold">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {showLowStock && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">재고 부족 알림</h4>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    {lowStockBooks.length}종 부족
                  </span>
                </div>
                <div className="space-y-2.5">
                  {lowStockBooks.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">모든 교재의 재고가 충분합니다!</p>
                    </div>
                  ) : (
                    lowStockBooks.slice(0, 4).map((book) => (
                      <div key={book.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 text-xs flex justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{book.title}</p>
                          <p className="text-[11px] text-slate-500">최소권장: {book.minStock}권</p>
                        </div>
                        <span className="font-black text-amber-700">{book.stock}권</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button type="button" onClick={() => onNavigate('textbooks')} className="w-full py-2.5 mt-4 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl min-h-[44px] flex items-center justify-center gap-1">
                <Package className="w-3.5 h-3.5" />
                교재 입고 및 재고 조정하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
