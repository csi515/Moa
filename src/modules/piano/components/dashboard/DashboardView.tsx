import React from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { StatCard } from '@/shared/components/StatCard';
import { formatCurrency, formatKoreanDate } from '@/utils/formatters';
import {
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Receipt,
  TrendingUp,
  PlusCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Piano,
  GraduationCap,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  Package,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { setActiveTab, setSelectedStudentId, currentUser } = useApp();

  const stats = StorageService.getDashboardStats();
  const tbStats = StorageService.getTextbookStats();
  const lowStockBooks = StorageService.getLowStockTextbooks();
  const recentSales = StorageService.getTextbookSales().slice(0, 4);
  const students = StorageService.getStudents();
  const recentInvoices = StorageService.getInvoices().filter(i => i.status === 'unpaid').slice(0, 3);

  const currentMonthLabel = `${parseInt(stats.currentYearMonth.slice(5, 7), 10)}월`;
  const hasRevenueData = stats.revenueTrend.some((r) => r.매출 > 0 || r.지출 > 0);
  const hasStudentTrendData = stats.studentTrend.some((s) => s.원생수 > 0);
  const hasTuitionData = stats.totalBilledThisMonth > 0;
  const hasClassData = stats.classDistribution.length > 0;

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-white/10 text-indigo-200 text-xs font-semibold rounded-full backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                오늘의 학원 브리핑
              </span>
              <span className="text-xs text-indigo-300 font-medium">
                {formatKoreanDate(new Date().toISOString())}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              안녕하세요, {currentUser.name}! 🎹
            </h2>
            <p className="text-sm text-indigo-200 mt-2 max-w-2xl leading-relaxed">
              오늘 예정된 수업은 <strong className="text-white underline">{stats.todayClassesCount}개 반</strong>이며,
              재원생 <strong className="text-white">{stats.activeStudents}명</strong>이 즐겁게 피아노를 배우고 있습니다.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-4 py-2.5 bg-white text-indigo-900 font-bold text-xs sm:text-sm rounded-xl hover:bg-indigo-50 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              오늘 출결 체크
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className="px-4 py-2.5 bg-indigo-600/60 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              신규 원생 등록
            </button>
          </div>
        </div>
      </div>

      {/* 10 Core Stat Metrics Grid */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          학원 핵심 운영 지표
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <StatCard
            title="전체 원생"
            value={`${stats.totalStudents}명`}
            subtitle={`재원 ${stats.activeStudents} / 휴원 ${stats.leaveStudents}`}
            icon={<Users className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-50"
            onClick={() => setActiveTab('students')}
          />
          <StatCard
            title="수강 중 (재원)"
            value={`${stats.activeStudents}명`}
            subtitle="현재 정규 수강 중"
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            onClick={() => setActiveTab('students')}
          />
          <StatCard
            title="신규 등록 (이번달)"
            value={`${stats.newStudentsThisMonth}명`}
            subtitle={`${currentMonthLabel} 신규 입학`}
            icon={<UserPlus className="w-5 h-5 text-teal-600" />}
            iconBg="bg-teal-50"
            onClick={() => setActiveTab('students')}
          />

          <StatCard
            title="수강료 매출"
            value={formatCurrency(stats.totalPaidThisMonth)}
            subtitle={`수납률 ${stats.collectionRate}% (청구 ${formatCurrency(stats.totalBilledThisMonth)})`}
            icon={<CreditCard className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50"
            onClick={() => setActiveTab('tuition')}
            highlight
          />
          <StatCard
            title="미납 수강료"
            value={formatCurrency(stats.totalUnpaidThisMonth)}
            subtitle={`미납 원생 ${stats.unpaidStudentsCount}명`}
            icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
            iconBg="bg-rose-50"
            onClick={() => setActiveTab('tuition')}
          />

          <StatCard
            title="오늘 수업"
            value={`${stats.todayClassesCount}개`}
            subtitle="개설된 정규 클래스"
            icon={<Clock className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-50"
            onClick={() => setActiveTab('timetable')}
          />
          <StatCard
            title="오늘 출석"
            value={`${stats.todayPresent}명`}
            subtitle={`지각/조퇴 ${stats.todayLate}명`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            onClick={() => setActiveTab('attendance')}
          />
          <StatCard
            title="오늘 결석"
            value={`${stats.todayAbsent}명`}
            subtitle="보강 일정 확인 필요"
            icon={<XCircle className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
            onClick={() => setActiveTab('attendance')}
          />

          <StatCard
            title="교재 판매액 (이번달)"
            value={formatCurrency(tbStats.totalSalesAmount)}
            subtitle={`수납 ${formatCurrency(tbStats.totalPaidAmount)} / 미납 ${formatCurrency(tbStats.totalUnpaidAmount)}`}
            icon={<BookOpen className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
            onClick={() => setActiveTab('textbooks')}
          />
          <StatCard
            title="재고 부족 교재"
            value={`${lowStockBooks.length}종`}
            subtitle={lowStockBooks.length > 0 ? '최소 재고 미달 발주 필요' : '모든 교재 재고 안정'}
            icon={<Package className="w-5 h-5 text-rose-600" />}
            iconBg="bg-rose-50"
            onClick={() => setActiveTab('textbooks')}
          />
          <StatCard
            title="이번 달 지출"
            value={formatCurrency(stats.totalExpensesThisMonth)}
            subtitle="임대료, 관리비, 조율비 등"
            icon={<Receipt className="w-5 h-5 text-orange-600" />}
            iconBg="bg-orange-50"
            onClick={() => setActiveTab('expenses')}
          />
          <StatCard
            title="이번 달 순수익"
            value={formatCurrency(stats.netProfitThisMonth)}
            subtitle="수강료+교재매출 - 지출"
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            onClick={() => setActiveTab('tuition')}
          />
        </div>
      </div>

      {/* 4 Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue vs Expense Trend (6 Months) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 text-base">
                최근 6개월 매출 및 지출 추이
              </h4>
              <p className="text-xs text-slate-400">수강료 수납액과 운영 지출 비교</p>
            </div>
            <button
              onClick={() => setActiveTab('tuition')}
              className="text-xs text-indigo-600 font-semibold flex items-center hover:underline"
            >
              상세 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 sm:h-72 w-full">
            {hasRevenueData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `${val / 10000}만`}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="매출" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="지출" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <TrendingUp className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-bold text-slate-600 text-sm">아직 매출 데이터가 없습니다</p>
                <p className="text-xs text-slate-400 mt-1">원생 등록 후 수강료 청구·수납을 시작하면 추이가 표시됩니다.</p>
                <button
                  onClick={() => setActiveTab('tuition')}
                  className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                >
                  수강료 관리로 이동
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Student Count Growth Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 text-base">
                최근 6개월 원생 수 추이
              </h4>
              <p className="text-xs text-slate-400">지속적인 재원생 등록 성장 추세</p>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs text-indigo-600 font-semibold flex items-center hover:underline"
            >
              원생목록 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 sm:h-72 w-full">
            {hasStudentTrendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.studentTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    formatter={(val: any) => [`${val}명`, '원생수']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="원생수"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <Users className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-bold text-slate-600 text-sm">아직 등록된 원생이 없습니다</p>
                <p className="text-xs text-slate-400 mt-1">첫 원생을 등록하면 성장 추이가 표시됩니다.</p>
                <button
                  onClick={() => setActiveTab('students')}
                  className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                >
                  원생 등록하러 가기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Unpaid vs Paid Tuition Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-base">
                이번 달 수강료 수납 현황
              </h4>
              <p className="text-xs text-slate-400">총 청구액 대비 수납 완료 및 미납 현황</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              수납률 {stats.collectionRate}%
            </span>
          </div>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {hasTuitionData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.unpaidBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.unpaidBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center px-4">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-600 text-sm">이번 달 청구 내역이 없습니다</p>
                <p className="text-xs text-slate-400 mt-1">원생 등록 후 월별 수강료를 생성해 보세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Students per Class distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-base">
                반별 원생 수 및 정원 현황
              </h4>
              <p className="text-xs text-slate-400">현재 수강 인원과 반별 최대 정원</p>
            </div>
            <button
              onClick={() => setActiveTab('classes')}
              className="text-xs text-indigo-600 font-semibold flex items-center hover:underline"
            >
              반 관리 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 sm:h-72 w-full">
            {hasClassData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.classDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(val: any, name: string) => [`${val}명`, name === 'studentsCount' ? '현재원생' : '정원']}
                    labelFormatter={(_, payload) => (payload[0]?.payload as any)?.fullName || ''}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Legend
                    formatter={(value) => (value === 'studentsCount' ? '현재원생' : '최대정원')}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="studentsCount" fill="#4f46e5" name="studentsCount" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="capacity" fill="#cbd5e1" name="capacity" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <GraduationCap className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-bold text-slate-600 text-sm">개설된 반이 없습니다</p>
                <p className="text-xs text-slate-400 mt-1">반을 개설하고 원생을 배정해 보세요.</p>
                <button
                  onClick={() => setActiveTab('classes')}
                  className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                >
                  반 관리로 이동
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Today's Class Schedule & Recent Activity / Unpaid List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                오늘의 수업 일정 ({stats.todayClasses.length}개 반)
              </h4>
            </div>
            <button
              onClick={() => setActiveTab('timetable')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
            >
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
                const isCurrent = idx === 0; // Highlight first/active
                return (
                  <div
                    key={cls.id}
                    className={`p-4 border rounded-xl flex flex-col gap-2 transition-all ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 ring-offset-2'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {cls.startTime} - {cls.endTime}
                      </span>
                      <span className="text-xs text-slate-400">{cls.teacherName}</span>
                    </div>
                    <p className={`text-sm font-bold ${isCurrent ? 'text-indigo-950' : 'text-slate-800'}`}>
                      {cls.name}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-slate-500">
                        정원: {enrolled.length}/{cls.capacity}명 {isFull && <span className="text-rose-500 font-bold">(만석)</span>}
                      </span>
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          isCurrent ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-slate-200 hover:bg-indigo-50'
                        }`}
                      >
                        출결
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Lesson Notes & Quick Unpaid List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 text-base">
                미납 수강료 현황
              </h4>
              <button
                onClick={() => setActiveTab('tuition')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                전체보기
              </button>
            </div>

            <div className="space-y-3">
              {recentInvoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">미납된 수강료가 없습니다. ✨</p>
              ) : (
                recentInvoices.map((inv, i) => (
                  <div
                    key={inv.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      i === 0
                        ? 'bg-rose-50 border-rose-100 text-rose-900'
                        : 'hover:bg-slate-50 border-transparent text-slate-800'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${i === 0 ? 'text-rose-900' : 'text-slate-800'}`}>
                        {inv.studentName}
                      </p>
                      <p className={`text-xs ${i === 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                        수납예정일: {inv.dueDate.slice(5)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${i === 0 ? 'text-rose-900' : 'text-slate-800'}`}>
                        {formatCurrency(inv.unpaidAmount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('tuition')}
            className="w-full py-2.5 mt-4 text-xs font-semibold text-slate-500 bg-slate-50 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 transition-colors"
          >
            미납 수강료 전체 보기
          </button>
        </div>
      </div>
      {/* Textbook Sales & Stock Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Textbook Sales Summary & Recent Sales */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">
                  교재 판매 및 교재비 수납 현황
                </h4>
                <p className="text-xs text-slate-400">
                  수강료와 분리되어 투명하게 관리되는 교재 판매 내역
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('textbooks')}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                교재 관리 전체 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl mb-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">{currentMonthLabel} 판매 총액</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrency(tbStats.totalSalesAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">교재비 수납액</span>
              <span className="font-bold text-emerald-600 text-sm">
                {formatCurrency(tbStats.totalPaidAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">교재비 미납액</span>
              <span className="font-black text-rose-600 text-sm">
                {formatCurrency(tbStats.totalUnpaidAmount)}
              </span>
            </div>
          </div>

          {/* Recent Sales List */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700">최근 교재 판매 이력</h5>
            {recentSales.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">등록된 교재 판매 내역이 없습니다.</p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sale.studentName}</span>
                      <span className="text-slate-400">({sale.textbookTitle} {sale.quantity}권)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      판매일: {sale.saleDate} | 학부모: {sale.parentName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(sale.totalAmount)}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        sale.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : sale.status === 'partial'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {sale.status === 'paid'
                        ? '완납'
                        : sale.status === 'partial'
                        ? `일부미납 (${formatCurrency(sale.unpaidAmount)})`
                        : '미납'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Warning Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">
                  재고 부족 알림
                </h4>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                {lowStockBooks.length}종 부족
              </span>
            </div>

            <div className="space-y-2.5">
              {lowStockBooks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    모든 교재의 재고가 충분합니다! ✨
                  </p>
                </div>
              ) : (
                lowStockBooks.slice(0, 4).map((book) => {
                  const isZero = book.stock <= 0;
                  return (
                    <div
                      key={book.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        isZero ? 'bg-rose-50/70 border-rose-200' : 'bg-amber-50/60 border-amber-200'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-900">{book.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {book.publisher} | 최소권장: {book.minStock}권
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black text-sm block ${
                            isZero ? 'text-rose-600' : 'text-amber-700'
                          }`}
                        >
                          {book.stock}권 남음
                        </span>
                        <span className="text-[10px] text-rose-500 font-semibold">
                          {isZero ? '품절/발주요망' : '재고부족'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('textbooks')}
            className="w-full py-2.5 mt-4 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            교재 입고 및 재고 조정하기
          </button>
        </div>
      </div>
    </div>
  );
};
