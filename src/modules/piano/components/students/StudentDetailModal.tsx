import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { Student, AttendanceRecord, TuitionInvoice, Consultation, PracticeRecord, LessonRecord, TextbookSale } from '@/types';
import { NewSaleModal } from '../textbooks/NewSaleModal';
import { TextbookPaymentModal } from '../textbooks/TextbookPaymentModal';
import { TextbookReceiptModal } from '../textbooks/TextbookReceiptModal';
import {
  formatCurrency,
  formatDate,
  formatKoreanDate,
  formatPhone,
  getAttendanceBadge,
  getInvoiceStatusBadge,
  getLevelColor,
  getStudentStatusBadge
} from '@/utils/formatters';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  School,
  BookOpen,
  Calendar,
  CreditCard,
  MessageSquare,
  BookOpenCheck,
  FileText,
  Clock,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Piano,
  Award,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

type DetailTab = 'info' | 'classes' | 'attendance' | 'tuition' | 'textbooks' | 'consultations' | 'practice' | 'memo';

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onEdit
}) => {
  const { showToast, openConfirmDialog, currentUser, setActiveTab, triggerRefresh } = useApp();
  const [currentTab, setCurrentTab] = useState<DetailTab>('info');

  // Sub-modal states for adding records directly inside student modal
  const [isAddAttOpen, setIsAddAttOpen] = useState(false);
  const [newAttStatus, setNewAttStatus] = useState<any>('present');
  const [newAttDate, setNewAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [newAttMemo, setNewAttMemo] = useState('');

  const [isAddCstOpen, setIsAddCstOpen] = useState(false);
  const [newCstType, setNewCstType] = useState<any>('learning');
  const [newCstContent, setNewCstContent] = useState('');
  const [newCstResult, setNewCstResult] = useState('');
  const [newCstNextDate, setNewCstNextDate] = useState('');

  const [isAddPrOpen, setIsAddPrOpen] = useState(false);
  const [newPrDate, setNewPrDate] = useState(new Date().toISOString().slice(0, 10));
  const [newPrMinutes, setNewPrMinutes] = useState(40);
  const [newPrSong, setNewPrSong] = useState('');
  const [newPrDifficulty, setNewPrDifficulty] = useState('');
  const [newPrHomework, setNewPrHomework] = useState('');

  // Payment record modal
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'card' | 'transfer' | 'cash' | 'other'>('card');
  const [payMemo, setPayMemo] = useState('');

  // Textbook modals inside student modal
  const [isStudentSaleModalOpen, setIsStudentSaleModalOpen] = useState(false);
  const [isStudentTbPaymentModalOpen, setIsStudentTbPaymentModalOpen] = useState(false);
  const [selectedStudentSaleForPay, setSelectedStudentSaleForPay] = useState<TextbookSale | null>(null);
  const [isTbReceiptOpen, setIsTbReceiptOpen] = useState(false);
  const [tbReceiptSale, setTbReceiptSale] = useState<TextbookSale | null>(null);

  if (!isOpen || !student) return null;

  const allClasses = StorageService.getClasses();
  const enrolledClasses = allClasses.filter((c) => student.classIds?.includes(c.id));
  const allAttendance = StorageService.getAttendance().filter((a) => a.studentId === student.id);
  const allInvoices = StorageService.getInvoices().filter((i) => i.studentId === student.id);
  const allConsultations = StorageService.getConsultations().filter((c) => c.studentId === student.id);
  const allPractice = StorageService.getPracticeRecords().filter((p) => p.studentId === student.id);
  const allLessons = StorageService.getLessonRecords().filter((l) => l.studentId === student.id);
  const studentSales = StorageService.getTextbookSalesByStudentId(student.id);
  const billingSummary = StorageService.getStudentBillingSummary(student.id);

  // Attendance stats for student
  const totalAttCount = allAttendance.length;
  const presentCount = allAttendance.filter((a) => a.status === 'present' || a.status === 'make_up').length;
  const attRate = totalAttCount > 0 ? Math.round((presentCount / totalAttCount) * 100) : 100;

  // Practice stats for student
  const totalPracticeMinutes = allPractice.reduce((sum, p) => sum + p.minutes, 0);

  const handleDelete = () => {
    openConfirmDialog({
      title: '원생 정보 삭제',
      message: `${student.name} 원생을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: () => {
        StorageService.deleteStudent(student.id);
        showToast(`${student.name} 원생이 삭제되었습니다.`, 'info');
        onClose();
      }
    });
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = enrolledClasses[0] || allClasses[0];
    StorageService.saveAttendanceRecord({
      date: newAttDate,
      studentId: student.id,
      studentName: student.name,
      classId: targetClass ? targetClass.id : 'c-default',
      className: targetClass ? targetClass.name : '일반 레슨',
      status: newAttStatus,
      memo: newAttMemo,
      createdBy: currentUser.name
    });
    showToast('출결 기록이 저장되었습니다.', 'success');
    setIsAddAttOpen(false);
    setNewAttMemo('');
  };

  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCstContent.trim()) {
      showToast('상담 내용을 입력해주세요.', 'warning');
      return;
    }
    StorageService.saveConsultation({
      studentId: student.id,
      studentName: student.name,
      parentName: student.parentName,
      date: new Date().toISOString().slice(0, 10),
      type: newCstType,
      content: newCstContent.trim(),
      result: newCstResult.trim(),
      nextDate: newCstNextDate || undefined,
      counselorId: StorageService.getTeachers()[0]?.id || '',
      counselorName: currentUser.name
    });
    showToast('상담 기록이 저장되었습니다.', 'success');
    setIsAddCstOpen(false);
    setNewCstContent('');
    setNewCstResult('');
  };

  const handleSavePractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrSong.trim()) {
      showToast('연습곡을 입력해주세요.', 'warning');
      return;
    }
    StorageService.savePracticeRecord({
      studentId: student.id,
      studentName: student.name,
      date: newPrDate,
      minutes: Number(newPrMinutes) || 30,
      songTitle: newPrSong.trim(),
      difficultyPart: newPrDifficulty.trim(),
      homework: newPrHomework.trim(),
      teacherEvaluation: '⭐⭐⭐⭐'
    });
    showToast('연습 기록이 저장되었습니다.', 'success');
    setIsAddPrOpen(false);
    setNewPrSong('');
    setNewPrDifficulty('');
    setNewPrHomework('');
  };

  const handleOpenPayModal = (inv: TuitionInvoice) => {
    setPayInvoiceId(inv.id);
    setPayAmount(inv.unpaidAmount);
    setPayMethod('card');
    setPayMemo('');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoiceId) return;
    StorageService.recordPayment(payInvoiceId, payAmount, payMethod, payMemo);
    showToast(`₩${payAmount.toLocaleString()}원 수납 처리가 완료되었습니다.`, 'success');
    setPayInvoiceId(null);
  };

  const statusBadge = getStudentStatusBadge(student.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Header Profile Summary */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0"
              style={{ backgroundColor: student.avatarColor || '#4f46e5' }}
            >
              {student.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {student.name}
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${statusBadge.bg}`}>
                  {statusBadge.label}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getLevelColor(student.level)}`}>
                  {student.level}
                </span>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {student.studentNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {student.school} {student.grade} | 담당: <strong>{student.teacherName}</strong> | 생년월일: {student.birthDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <a
              href={`tel:${student.parentPhone}`}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">학부모</span> 전화
            </a>
            <>
              <button
                onClick={() => onEdit(student)}
                className="p-2 text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                title="원생 정보 수정"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 transition-colors"
                title="원생 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 8 Tabs Bar */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'info', label: '기본정보', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'classes', label: `수업 (${enrolledClasses.length})`, icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'attendance', label: `출결 (${attRate}%)`, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
            { id: 'tuition', label: `수강료 (${allInvoices.length})`, icon: <CreditCard className="w-3.5 h-3.5" /> },
            { id: 'textbooks', label: `교재 구매 (${studentSales.length})`, icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'consultations', label: `상담 (${allConsultations.length})`, icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'practice', label: `연습/레슨 (${allPractice.length})`, icon: <Piano className="w-3.5 h-3.5" /> },
            { id: 'memo', label: '메모/특이사항', icon: <FileText className="w-3.5 h-3.5" /> }
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as DetailTab)}
                className={`py-3 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: 기본정보 */}
          {currentTab === 'info' && (
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
                  <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">학부모 성함</span>
                    <span className="font-bold text-slate-800">{student.parentName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">학부모 연락처</span>
                    <a href={`tel:${student.parentPhone}`} className="font-mono font-bold text-indigo-600 hover:underline">
                      {formatPhone(student.parentPhone)}
                    </a>
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
                    <span className="font-bold text-emerald-700">{totalPracticeMinutes}분 ({Math.round(totalPracticeMinutes/60)}시간)</span>
                  </div>
                </div>
              </div>

              {/* Special notes highlight */}
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
          )}

          {/* TAB 2: 수업 */}
          {currentTab === 'classes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">배정된 수강 반 목록</h4>
              </div>
              {enrolledClasses.length === 0 ? (
                <p className="text-xs text-slate-500 p-8 text-center bg-slate-50 rounded-2xl">배정된 반이 없습니다. 원생 정보를 수정하여 반을 배정하세요.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enrolledClasses.map((cls) => (
                    <div key={cls.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-sm text-slate-900">{cls.name}</h5>
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {cls.room}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        ⏰ 요일: <strong>{cls.daysOfWeek.join(', ')}</strong> | {cls.startTime} ~ {cls.endTime}
                      </p>
                      <p className="text-xs text-slate-500">
                        선생님: {cls.teacherName} | 사용 교재: {cls.textbook || '-'}
                      </p>
                      {cls.memo && <p className="text-[11px] text-slate-400 bg-white p-2 rounded-lg">{cls.memo}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 출결 */}
          {currentTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">출결 이력 및 출석률</h4>
                  <p className="text-xs text-slate-500">
                    총 {totalAttCount}회 중 출석 {presentCount}회 (출석률 {attRate}%)
                  </p>
                </div>
                <button
                  onClick={() => setIsAddAttOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> 출결 기록 추가
                </button>
              </div>

              {/* Attendance add form collapse */}
              {isAddAttOpen && (
                <form onSubmit={handleSaveAttendance} className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-900">새 출결 기록 등록</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">날짜</label>
                      <input
                        type="date"
                        value={newAttDate}
                        onChange={(e) => setNewAttDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">상태</label>
                      <select
                        value={newAttStatus}
                        onChange={(e) => setNewAttStatus(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="present">출석</option>
                        <option value="absent">결석</option>
                        <option value="late">지각</option>
                        <option value="early_leave">조퇴</option>
                        <option value="make_up">보강</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">메모/사유</label>
                      <input
                        type="text"
                        placeholder="사유 또는 메모..."
                        value={newAttMemo}
                        onChange={(e) => setNewAttMemo(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddAttOpen(false)}
                      className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      저장
                    </button>
                  </div>
                </form>
              )}

              {/* Attendance list */}
              {allAttendance.length === 0 ? (
                <p className="text-xs text-slate-500 p-8 text-center bg-slate-50 rounded-2xl">출결 기록이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {allAttendance.map((att) => {
                    const badge = getAttendanceBadge(att.status);
                    return (
                      <div
                        key={att.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">{att.date}</span>
                            <span className="text-slate-500 ml-2">({att.className})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {att.absentReason && (
                            <span className="text-rose-600 font-medium mr-2">사유: {att.absentReason}</span>
                          )}
                          {att.memo && <span className="text-slate-600">{att.memo}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 수강료 */}
          {currentTab === 'tuition' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">수강료 청구 및 납부 내역</h4>
                  <p className="text-xs text-slate-500">월별 수납 청구서 및 결제 영수증</p>
                </div>
                <button
                  onClick={() => {
                    StorageService.createInvoiceForStudent(student);
                    showToast('이번 달 신규 청구서가 발행되었습니다.', 'success');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> 청구서 추가 발행
                </button>
              </div>

              {/* Payment Processing Form Modal */}
              {payInvoiceId && (
                <form onSubmit={handleProcessPayment} className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
                  <h5 className="text-xs font-bold text-emerald-900">수강료 수납 처리</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">수납 금액 (₩)</label>
                      <input
                        type="number"
                        step="1000"
                        value={payAmount}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">결제 방법</label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="card">카드 결제</option>
                        <option value="transfer">계좌 이체</option>
                        <option value="cash">현금</option>
                        <option value="other">기타</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">수납 메모</label>
                      <input
                        type="text"
                        placeholder="영수증 메모..."
                        value={payMemo}
                        onChange={(e) => setPayMemo(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPayInvoiceId(null)}
                      className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                    >
                      수납 완료 저장
                    </button>
                  </div>
                </form>
              )}

              {/* Invoices List */}
              {allInvoices.length === 0 ? (
                <p className="text-xs text-slate-500 p-8 text-center bg-slate-50 rounded-2xl">청구된 수강료 내역이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {allInvoices.map((inv) => {
                    const badge = getInvoiceStatusBadge(inv.status);
                    return (
                      <div
                        key={inv.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{inv.yearMonth}월 청구서</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${badge.bg}`}>
                              {badge.label}
                            </span>
                            {inv.receiptNumber && (
                              <span className="text-[10px] font-mono text-slate-400">
                                #{inv.receiptNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 mt-1">
                            납부기한: {inv.dueDate} | 총 청구: <strong>{formatCurrency(inv.totalAmount)}</strong>
                            {inv.paidAmount > 0 && ` (납부: ${formatCurrency(inv.paidAmount)})`}
                            {inv.unpaidAmount > 0 && ` [미납: ${formatCurrency(inv.unpaidAmount)}]`}
                          </p>
                          {inv.notes && <p className="text-slate-600 text-[11px] mt-1 italic">{inv.notes}</p>}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => handleOpenPayModal(inv)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                            >
                              수납 결제
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: 교재 구매 및 교재비 수납 */}
          {currentTab === 'textbooks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">교재 구매 및 교재비 내역</h4>
                  <p className="text-xs text-slate-500">
                    원생에게 지급된 교재 목록 및 미납/수납 내역입니다. (총 {studentSales.length}건)
                  </p>
                </div>
                <button
                  onClick={() => setIsStudentSaleModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> 새 교재 판매 등록
                </button>
              </div>

              {/* Billing Summary Banner for this Student */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">교재 총 구매액</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(billingSummary.textbookBilled || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">교재비 수납 완료</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {formatCurrency(billingSummary.textbookPaid || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">교재비 미납 잔액</span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatCurrency(billingSummary.textbookUnpaid || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">전체 총 청구합계</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    {formatCurrency(billingSummary.totalBilled || 0)}
                  </span>
                </div>
              </div>

              {/* Sales List */}
              {studentSales.length === 0 ? (
                <div className="text-xs text-slate-500 p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium">구매한 교재 내역이 없습니다.</p>
                  <button
                    onClick={() => setIsStudentSaleModalOpen(true)}
                    className="mt-2 text-indigo-600 font-bold hover:underline inline-block"
                  >
                    + 첫 교재 지급/판매 등록하기
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{sale.textbookTitle}</span>
                          <span className="text-slate-400 text-xs">({sale.quantity}권)</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              sale.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : sale.status === 'partial'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {sale.status === 'paid' ? '완납' : sale.status === 'partial' ? '일부납부' : '미납'}
                          </span>
                        </div>
                        <p className="text-slate-500">
                          판매일: {sale.saleDate} | 판매금액: <strong>{formatCurrency(sale.totalAmount)}</strong>
                          {sale.discount > 0 && ` (할인: ${formatCurrency(sale.discount)})`}
                          {sale.paidAmount > 0 && ` [수납: ${formatCurrency(sale.paidAmount)}]`}
                          {sale.unpaidAmount > 0 && (
                            <strong className="text-rose-600"> [미납 잔액: {formatCurrency(sale.unpaidAmount)}]</strong>
                          )}
                        </p>
                        {sale.memo && <p className="text-slate-500 text-[11px] italic">{sale.memo}</p>}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {sale.unpaidAmount > 0 && (
                          <button
                            onClick={() => {
                              setSelectedStudentSaleForPay(sale);
                              setIsStudentTbPaymentModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                          >
                            교재비 수납
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setTbReceiptSale(sale);
                            setIsTbReceiptOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                        >
                          영수증
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: 상담 */}
          {currentTab === 'consultations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">상담 기록</h4>
                  <p className="text-xs text-slate-500">학부모 및 원생과의 상담 이력</p>
                </div>
                <button
                  onClick={() => setIsAddCstOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> 상담 기록 작성
                </button>
              </div>

              {/* New Consultation Form */}
              {isAddCstOpen && (
                <form onSubmit={handleSaveConsultation} className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3">
                  <h5 className="text-xs font-bold text-purple-900">새 상담 작성</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">상담 유형</label>
                      <select
                        value={newCstType}
                        onChange={(e) => setNewCstType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="parent">학부모 상담</option>
                        <option value="student">원생 상담</option>
                        <option value="career">진로/입시 상담</option>
                        <option value="learning">학습/진도 상담</option>
                        <option value="other">기타</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">다음 상담 예정일</label>
                      <input
                        type="date"
                        value={newCstNextDate}
                        onChange={(e) => setNewCstNextDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">상담 내용</label>
                      <textarea
                        rows={2}
                        placeholder="상담 내용을 자세히 기록하세요..."
                        value={newCstContent}
                        onChange={(e) => setNewCstContent(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg resize-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">상담 결과 및 후속 조치</label>
                      <input
                        type="text"
                        placeholder="합의된 내용 또는 후속 조치..."
                        value={newCstResult}
                        onChange={(e) => setNewCstResult(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddCstOpen(false)}
                      className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 text-xs font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                    >
                      저장
                    </button>
                  </div>
                </form>
              )}

              {/* Consultation List */}
              {allConsultations.length === 0 ? (
                <p className="text-xs text-slate-500 p-8 text-center bg-slate-50 rounded-2xl">등록된 상담 기록이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {allConsultations.map((cst) => (
                    <div key={cst.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{cst.date}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            {cst.type === 'parent' ? '학부모 상담' : cst.type === 'learning' ? '학습 진도' : cst.type === 'career' ? '진로/입시' : '일반'}
                          </span>
                        </div>
                        <span className="text-slate-400 font-medium">상담자: {cst.counselorName}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{cst.content}</p>
                      {cst.result && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 text-slate-700">
                          <strong>결과/조치:</strong> {cst.result}
                        </div>
                      )}
                      {cst.nextDate && (
                        <p className="text-[11px] text-indigo-600 font-medium">
                          📅 다음 상담 예정: {cst.nextDate}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: 연습기록 & 레슨 */}
          {currentTab === 'practice' && (
            <div className="space-y-6">
              {/* Practice section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">원생 연습 일지</h4>
                    <p className="text-xs text-slate-500">누적 연습시간: {totalPracticeMinutes}분</p>
                  </div>
                  <button
                    onClick={() => setIsAddPrOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> 연습 기록 추가
                  </button>
                </div>

                {isAddPrOpen && (
                  <form onSubmit={handleSavePractice} className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-3 mb-4">
                    <h5 className="text-xs font-bold text-teal-900">새 연습 기록 등록</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">연습일</label>
                        <input
                          type="date"
                          value={newPrDate}
                          onChange={(e) => setNewPrDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">연습 시간 (분)</label>
                        <input
                          type="number"
                          value={newPrMinutes}
                          onChange={(e) => setNewPrMinutes(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">연습곡/교재</label>
                        <input
                          type="text"
                          placeholder="예: 체르니 100번 38번, 하농 5번"
                          value={newPrSong}
                          onChange={(e) => setNewPrSong(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">어려운 부분 / 집중 포인트</label>
                        <input
                          type="text"
                          placeholder="예: 4번 손가락 독립 및 왼손 반주 리듬"
                          value={newPrDifficulty}
                          onChange={(e) => setNewPrDifficulty(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddPrOpen(false)}
                        className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 text-xs font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                      >
                        저장
                      </button>
                    </div>
                  </form>
                )}

                {allPractice.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center bg-slate-50 rounded-2xl">연습 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {allPractice.map((pr) => (
                      <div key={pr.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{pr.date} ({pr.minutes}분 연습)</span>
                          <span className="text-amber-600 font-bold">{pr.teacherEvaluation || '평가 완료'}</span>
                        </div>
                        <p className="text-indigo-700 font-semibold mt-1">🎵 {pr.songTitle}</p>
                        {pr.difficultyPart && (
                          <p className="text-slate-600 text-[11px] mt-1">포인트: {pr.difficultyPart}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lesson Records section */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-3">선생님 레슨 기록</h4>
                {allLessons.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center bg-slate-50 rounded-2xl">레슨 일지가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {allLessons.map((ls) => (
                      <div key={ls.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{ls.date} 레슨</span>
                          <span className="text-slate-500">{ls.teacherName}</span>
                        </div>
                        <p className="font-bold text-indigo-700">진도: {ls.songTitle} ({ls.progress})</p>
                        <p className="text-slate-700 leading-relaxed">{ls.lessonContent}</p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200/60 mt-2">
                          <div>
                            <strong className="text-emerald-700">잘한 점:</strong> {ls.strengths}
                          </div>
                          <div>
                            <strong className="text-rose-700">보완점:</strong> {ls.weaknesses}
                          </div>
                        </div>
                        {ls.homework && (
                          <p className="text-[11px] text-purple-700 font-semibold mt-1">
                            📝 숙제: {ls.homework}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: 메모 */}
          {currentTab === 'memo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="text-xs font-bold text-slate-700 uppercase">특이사항</h5>
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {student.specialNotes || '등록된 특이사항이 없습니다.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="text-xs font-bold text-slate-700 uppercase">학원 내부 메모</h5>
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {student.memo || '등록된 내부 메모가 없습니다.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Textbook Sub-Modals */}
      {isStudentSaleModalOpen && (
        <NewSaleModal
          initialStudentId={student.id}
          onSuccess={() => {
            setIsStudentSaleModalOpen(false);
            triggerRefresh();
          }}
          onClose={() => setIsStudentSaleModalOpen(false)}
        />
      )}

      {isStudentTbPaymentModalOpen && selectedStudentSaleForPay && (
        <TextbookPaymentModal
          sale={selectedStudentSaleForPay}
          onSuccess={() => {
            setIsStudentTbPaymentModalOpen(false);
            triggerRefresh();
          }}
          onClose={() => setIsStudentTbPaymentModalOpen(false)}
        />
      )}

      {isTbReceiptOpen && tbReceiptSale && (
        <TextbookReceiptModal
          sale={tbReceiptSale}
          onClose={() => setIsTbReceiptOpen(false)}
        />
      )}
    </div>
  );
};
