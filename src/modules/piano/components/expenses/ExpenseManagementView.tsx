import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { ExpenseItem, ExpenseCategory, PaymentMethod } from '@/types';
import { formatCurrency, getExpenseCategoryLabel } from '@/utils/formatters';
import {
  Receipt,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  DollarSign,
  PieChart as PieIcon,
  X,
  Save,
  ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

export const ExpenseManagementView: React.FC = () => {
  const { showToast, openConfirmDialog, currentUser } = useApp();
  const isDirector = currentUser.role === 'director';

  const [selectedMonth, setSelectedMonth] = useState('2025-08');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'utility' as ExpenseCategory,
    amount: 50000,
    description: '',
    recipient: '',
    paymentMethod: 'card' as PaymentMethod,
    memo: ''
  });

  const expenses = StorageService.getExpenses();

  if (!isDirector) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">접근 권한이 제한되었습니다</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          학원 지출 및 회계 관리는 원장님 전용 메뉴입니다.
        </p>
      </div>
    );
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedMonth && !e.date.startsWith(selectedMonth)) return false;
      if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
      return true;
    });
  }, [expenses, selectedMonth, categoryFilter]);

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for chart
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const label = getExpenseCategoryLabel(e.category);
      map.set(label, (map.get(label) || 0) + e.amount);
    });

    const colors = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#64748b'];
    return Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [filteredExpenses]);

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: 'utility',
      amount: 50000,
      description: '',
      recipient: '',
      paymentMethod: 'card',
      memo: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setFormData({
      date: exp.date,
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      recipient: exp.recipient || '',
      paymentMethod: exp.paymentMethod || 'card',
      memo: exp.memo || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (exp: ExpenseItem) => {
    openConfirmDialog({
      title: '지출 항목 삭제',
      message: `'${exp.description}' 지출 내역(${formatCurrency(exp.amount)})을 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: () => {
        StorageService.deleteExpense(exp.id);
        showToast('지출 내역이 삭제되었습니다.', 'info');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      showToast('지출 적요를 입력해주세요.', 'warning');
      return;
    }

    StorageService.saveExpense({
      ...(editingExpense ? { id: editingExpense.id } : {}),
      date: formData.date,
      category: formData.category,
      amount: Number(formData.amount) || 0,
      description: formData.description.trim(),
      recipient: formData.recipient.trim(),
      paymentMethod: formData.paymentMethod,
      memo: formData.memo.trim()
    } as any);

    showToast(
      editingExpense ? '지출 내역이 수정되었습니다.' : '신규 지출이 등록되었습니다.',
      'success'
    );
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            학원 지출 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            임대료, 관리비, 피아노 조율비, 교재 구입비, 강사료 등 운영비 관리
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          신규 지출 등록
        </button>
      </div>

      {/* Top Total & Category Chart Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {selectedMonth}월 총 지출액
            </span>
            <p className="text-3xl font-black text-rose-600 mt-2">
              {formatCurrency(totalExpenseAmount)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              등록된 지출 내역: {filteredExpenses.length}건
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-700">지출 관리 팁 💡</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              피아노 조율 및 정기 점검비용, 교재비 영수증을 꾸준히 기록하시면 연말 정산 및 종합소득세 신고 시 증빙자료로 유용합니다.
            </p>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-2">항목별 지출 구성</h4>
          {categoryData.length === 0 ? (
            <p className="text-xs text-slate-400 p-8 text-center">지출 데이터가 없습니다.</p>
          ) : (
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
          >
            <option value="2025-08">2025년 8월</option>
            <option value="2025-07">2025년 7월</option>
            <option value="2025-06">2025년 6월</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          >
            <option value="ALL">전체 항목</option>
            <option value="rent">임대료</option>
            <option value="utility">관리비/공과금</option>
            <option value="piano_tuning">피아노 조율/수리</option>
            <option value="textbook">교재/악보 구입</option>
            <option value="snacks">간식/비품</option>
            <option value="teacher_salary">강사료</option>
            <option value="other">기타</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          합계: <strong className="text-rose-600 font-bold">{formatCurrency(totalExpenseAmount)}</strong>
        </span>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">지출 일자</th>
                <th className="py-3.5 px-4">분류 항목</th>
                <th className="py-3.5 px-4">적요 (상세내역)</th>
                <th className="py-3.5 px-4">지출 금액</th>
                <th className="py-3.5 px-4">결제처 / 결제수단</th>
                <th className="py-3.5 px-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    지출 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700">
                        {getExpenseCategoryLabel(exp.category)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span>{exp.recipient || '-'}</span>
                      <span className="text-slate-400 text-[11px] ml-1">
                        ({exp.paymentMethod === 'card' ? '카드' : exp.paymentMethod === 'transfer' ? '이체' : '현금'})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingExpense ? '지출 내역 수정' : '신규 지출 등록'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">지출 일자</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">분류 항목</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                  >
                    <option value="rent">임대료</option>
                    <option value="utility">관리비/공과금</option>
                    <option value="piano_tuning">피아노 조율/수리</option>
                    <option value="textbook">교재/악보 구입</option>
                    <option value="snacks">간식/비품</option>
                    <option value="teacher_salary">강사료</option>
                    <option value="other">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">지출 금액 (₩)</label>
                  <CurrencyInput
                    value={formData.amount}
                    onChange={(val) => setFormData({ ...formData, amount: val })}
                    showQuickButtons
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  적요 / 지출 내용 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 영창 피아노 3대 정기 조율 및 건반 수리"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">결제처 / 수취인</label>
                  <input
                    type="text"
                    placeholder="예: 서울조율사협회"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">결제 수단</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="card">카드 결제</option>
                    <option value="transfer">계좌 이체</option>
                    <option value="cash">현금</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">메모</label>
                <input
                  type="text"
                  placeholder="추가 비고..."
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
