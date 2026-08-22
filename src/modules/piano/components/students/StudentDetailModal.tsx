import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { RecitalService } from '@/modules/piano/services/recitalService';
import { PERFORMANCE_VIDEO_TYPE_LABEL } from '@/modules/piano/config/eventLabels';
import { Student, TuitionInvoice, PerformanceVideo, TextbookSale } from '@/types';
import { isValidYouTubeUrl } from '@/utils/youtube';
import { NewSaleModal } from '../textbooks/NewSaleModal';
import { getGuardiansForStudent, getPrimaryGuardian } from '@/core/parent';
import { usePermissions } from '@/core/auth/usePermissions';
import { isSupabaseConfigured } from '@/lib/supabase';
import { GuardianLinkInviteModal } from '@/modules/parent/GuardianLinkInviteModal';
import { TextbookPaymentModal } from '../textbooks/TextbookPaymentModal';
import { TextbookReceiptModal } from '../textbooks/TextbookReceiptModal';
import { getLevelColor, getStudentStatusBadge, formatPhone } from '@/utils/formatters';
import { X, Phone, Edit, Trash2 } from 'lucide-react';
import { DetailTab, getDetailTabConfig } from './detail/types';
import { StudentDetailInfoTab } from './detail/StudentDetailInfoTab';
import { StudentDetailClassesTab } from './detail/StudentDetailClassesTab';
import { StudentDetailAttendanceTab } from './detail/StudentDetailAttendanceTab';
import { StudentDetailTuitionTab } from './detail/StudentDetailTuitionTab';
import { StudentDetailTextbooksTab } from './detail/StudentDetailTextbooksTab';
import { StudentDetailConsultationsTab } from './detail/StudentDetailConsultationsTab';
import { StudentDetailPracticeTab } from './detail/StudentDetailPracticeTab';
import { StudentDetailVideosTab } from './detail/StudentDetailVideosTab';
import { StudentDetailMemoTab } from './detail/StudentDetailMemoTab';

export type { DetailTab } from './detail/types';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  initialTab?: DetailTab;
  onInitialTabApplied?: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onEdit,
  initialTab,
  onInitialTabApplied,
}) => {
  const { showToast, openConfirmDialog, currentUser, triggerRefresh } = useApp();
  const { attendanceEnabled, isAdmin } = usePermissions();
  const [currentTab, setCurrentTab] = useState<DetailTab>('info');
  const [guardianLinkOpen, setGuardianLinkOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setCurrentTab(initialTab);
      onInitialTabApplied?.();
    }
  }, [isOpen, initialTab, onInitialTabApplied]);

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

  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDate, setNewVideoDate] = useState(new Date().toISOString().slice(0, 10));
  const [newVideoType, setNewVideoType] = useState<PerformanceVideo['eventType']>('recital');
  const [newVideoEventId, setNewVideoEventId] = useState('');
  const [newVideoSong, setNewVideoSong] = useState('');
  const [newVideoMemo, setNewVideoMemo] = useState('');
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'card' | 'transfer' | 'cash' | 'other'>('card');
  const [payMemo, setPayMemo] = useState('');

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
  const allVideos = StorageService.getPerformanceVideosByStudentId(student.id);
  const recitalEvents = RecitalService.getRecitalEvents();
  const studentSales = StorageService.getTextbookSalesByStudentId(student.id);
  const billingSummary = StorageService.getStudentBillingSummary(student.id);
  const guardians = getGuardiansForStudent(student.id);
  const primaryGuardian = guardians.find((g) => g.isPrimary) || guardians[0];

  const totalAttCount = allAttendance.length;
  const presentCount = allAttendance.filter((a) => a.status === 'present' || a.status === 'make_up').length;
  const attRate = totalAttCount > 0 ? Math.round((presentCount / totalAttCount) * 100) : 100;

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
      parentName: getPrimaryGuardian(student.id)?.parentName || student.parentName || '학부모',
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

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim()) {
      showToast('영상 제목을 입력해주세요.', 'warning');
      return;
    }
    if (!isValidYouTubeUrl(newVideoUrl)) {
      showToast('올바른 YouTube 링크를 입력해주세요.', 'warning');
      return;
    }
    const linkedEvent = newVideoEventId
      ? recitalEvents.find((ev) => ev.id === newVideoEventId)
      : undefined;

    StorageService.savePerformanceVideo({
      studentId: student.id,
      studentName: student.name,
      title: newVideoTitle.trim(),
      youtubeUrl: newVideoUrl.trim(),
      recordedDate: newVideoDate || undefined,
      eventType: newVideoType,
      songTitle: newVideoSong.trim() || undefined,
      memo: newVideoMemo.trim() || undefined,
      eventId: linkedEvent?.id,
      eventTitle: linkedEvent?.title,
    });
    showToast('연주 영상이 등록되었습니다.', 'success');
    setIsAddVideoOpen(false);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoEventId('');
    setNewVideoSong('');
    setNewVideoMemo('');
  };

  const handleVideoEventChange = (eventId: string) => {
    setNewVideoEventId(eventId);
    if (!eventId) return;
    const ev = recitalEvents.find((item) => item.id === eventId);
    if (!ev) return;
    setNewVideoDate(ev.startDate);
    setNewVideoType(RecitalService.eventTypeToVideoType(ev.type));
    if (!newVideoTitle.trim()) {
      setNewVideoTitle(`${ev.title} - ${student.name}`);
    }
  };

  const handleDeleteVideo = (video: PerformanceVideo) => {
    openConfirmDialog({
      title: '연주 영상 삭제',
      message: `'${video.title}' 영상을 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: () => {
        StorageService.deletePerformanceVideo(video.id);
        if (previewVideoId === video.id) setPreviewVideoId(null);
        showToast('연주 영상이 삭제되었습니다.', 'info');
      },
    });
  };

  const videoTypeLabel = PERFORMANCE_VIDEO_TYPE_LABEL;

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

  const handleCreateInvoice = () => {
    StorageService.createInvoiceForStudent(student);
    showToast('이번 달 신규 청구서가 발행되었습니다.', 'success');
  };

  const statusBadge = getStudentStatusBadge(student.status);

  const tabConfig = getDetailTabConfig({
    enrolledClasses: enrolledClasses.length,
    attRate,
    invoiceCount: allInvoices.length,
    salesCount: studentSales.length,
    consultationCount: allConsultations.length,
    practiceCount: allPractice.length,
    videoCount: allVideos.length,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-4 flex flex-col max-h-[90vh]">
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
            {primaryGuardian?.parentPhone && (
              <a
                href={`tel:${primaryGuardian.parentPhone}`}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">학부모</span> 전화
              </a>
            )}
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

        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white overflow-x-auto shrink-0 scrollbar-none">
          {tabConfig.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
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

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {currentTab === 'info' && (
            <StudentDetailInfoTab
              student={student}
              guardians={guardians}
              totalPracticeMinutes={totalPracticeMinutes}
              attendanceEnabled={attendanceEnabled}
              isAdmin={isAdmin}
              isSupabaseConfigured={isSupabaseConfigured()}
              onEdit={onEdit}
              onOpenGuardianLink={() => setGuardianLinkOpen(true)}
            />
          )}

          {currentTab === 'classes' && (
            <StudentDetailClassesTab enrolledClasses={enrolledClasses} />
          )}

          {currentTab === 'attendance' && (
            <StudentDetailAttendanceTab
              allAttendance={allAttendance}
              totalAttCount={totalAttCount}
              presentCount={presentCount}
              attRate={attRate}
              isAddAttOpen={isAddAttOpen}
              setIsAddAttOpen={setIsAddAttOpen}
              newAttDate={newAttDate}
              setNewAttDate={setNewAttDate}
              newAttStatus={newAttStatus}
              setNewAttStatus={setNewAttStatus}
              newAttMemo={newAttMemo}
              setNewAttMemo={setNewAttMemo}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {currentTab === 'tuition' && (
            <StudentDetailTuitionTab
              allInvoices={allInvoices}
              payInvoiceId={payInvoiceId}
              setPayInvoiceId={setPayInvoiceId}
              payAmount={payAmount}
              setPayAmount={setPayAmount}
              payMethod={payMethod}
              setPayMethod={setPayMethod}
              payMemo={payMemo}
              setPayMemo={setPayMemo}
              onCreateInvoice={handleCreateInvoice}
              onOpenPayModal={handleOpenPayModal}
              onProcessPayment={handleProcessPayment}
            />
          )}

          {currentTab === 'textbooks' && (
            <StudentDetailTextbooksTab
              studentSales={studentSales}
              billingSummary={billingSummary}
              onOpenSaleModal={() => setIsStudentSaleModalOpen(true)}
              onOpenPaymentModal={(sale) => {
                setSelectedStudentSaleForPay(sale);
                setIsStudentTbPaymentModalOpen(true);
              }}
              onOpenReceiptModal={(sale) => {
                setTbReceiptSale(sale);
                setIsTbReceiptOpen(true);
              }}
            />
          )}

          {currentTab === 'consultations' && (
            <StudentDetailConsultationsTab
              allConsultations={allConsultations}
              isAddCstOpen={isAddCstOpen}
              setIsAddCstOpen={setIsAddCstOpen}
              newCstType={newCstType}
              setNewCstType={setNewCstType}
              newCstContent={newCstContent}
              setNewCstContent={setNewCstContent}
              newCstResult={newCstResult}
              setNewCstResult={setNewCstResult}
              newCstNextDate={newCstNextDate}
              setNewCstNextDate={setNewCstNextDate}
              onSaveConsultation={handleSaveConsultation}
            />
          )}

          {currentTab === 'practice' && (
            <StudentDetailPracticeTab
              allPractice={allPractice}
              allLessons={allLessons}
              totalPracticeMinutes={totalPracticeMinutes}
              isAddPrOpen={isAddPrOpen}
              setIsAddPrOpen={setIsAddPrOpen}
              newPrDate={newPrDate}
              setNewPrDate={setNewPrDate}
              newPrMinutes={newPrMinutes}
              setNewPrMinutes={setNewPrMinutes}
              newPrSong={newPrSong}
              setNewPrSong={setNewPrSong}
              newPrDifficulty={newPrDifficulty}
              setNewPrDifficulty={setNewPrDifficulty}
              onSavePractice={handleSavePractice}
            />
          )}

          {currentTab === 'videos' && (
            <StudentDetailVideosTab
              allVideos={allVideos}
              recitalEvents={recitalEvents}
              videoTypeLabel={videoTypeLabel}
              isAddVideoOpen={isAddVideoOpen}
              setIsAddVideoOpen={setIsAddVideoOpen}
              newVideoTitle={newVideoTitle}
              setNewVideoTitle={setNewVideoTitle}
              newVideoUrl={newVideoUrl}
              setNewVideoUrl={setNewVideoUrl}
              newVideoDate={newVideoDate}
              setNewVideoDate={setNewVideoDate}
              newVideoType={newVideoType}
              setNewVideoType={setNewVideoType}
              newVideoEventId={newVideoEventId}
              setNewVideoEventId={setNewVideoEventId}
              newVideoSong={newVideoSong}
              setNewVideoSong={setNewVideoSong}
              newVideoMemo={newVideoMemo}
              setNewVideoMemo={setNewVideoMemo}
              previewVideoId={previewVideoId}
              setPreviewVideoId={setPreviewVideoId}
              onSaveVideo={handleSaveVideo}
              onVideoEventChange={handleVideoEventChange}
              onDeleteVideo={handleDeleteVideo}
            />
          )}

          {currentTab === 'memo' && (
            <StudentDetailMemoTab student={student} />
          )}
        </div>
      </div>

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

      <GuardianLinkInviteModal
        studentId={student.id}
        studentName={student.name}
        isOpen={guardianLinkOpen}
        onClose={() => setGuardianLinkOpen(false)}
      />
    </div>
  );
};
