import React from 'react';
import type { Student } from '@/types';
import { NewSaleModal } from '@/modules/piano/components/textbooks/NewSaleModal';
import { GuardianLinkInviteModal } from '@/modules/parent/GuardianLinkInviteModal';
import { TextbookPaymentModal } from '@/modules/piano/components/textbooks/TextbookPaymentModal';
import { TextbookReceiptModal } from '@/modules/piano/components/textbooks/TextbookReceiptModal';
import { X, Phone, Edit, Trash2 } from 'lucide-react';
import { StudentDetailInfoTab } from './detail/StudentDetailInfoTab';
import { StudentDetailClassesTab } from './detail/StudentDetailClassesTab';
import { StudentDetailAttendanceTab } from './detail/StudentDetailAttendanceTab';
import { StudentDetailTuitionTab } from './detail/StudentDetailTuitionTab';
import { StudentDetailTextbooksTab } from './detail/StudentDetailTextbooksTab';
import { StudentDetailConsultationsTab } from './detail/StudentDetailConsultationsTab';
import { StudentDetailPracticeTab } from './detail/StudentDetailPracticeTab';
import { StudentDetailVideosTab } from './detail/StudentDetailVideosTab';
import { StudentDetailMemoTab } from './detail/StudentDetailMemoTab';
import { useStudentDetailModal } from './useStudentDetailModal';
import type { DetailTab } from './detail/types';

export type { DetailTab } from './detail/types';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  initialTab?: DetailTab;
  onInitialTabApplied?: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = (props) => {
  if (!props.isOpen || !props.student) return null;
  return <StudentDetailModalContent {...props} student={props.student} />;
};

const StudentDetailModalContent: React.FC<
  Omit<StudentDetailModalProps, 'student'> & { student: Student }
> = ({
  student,
  isOpen,
  onClose,
  onEdit,
  initialTab,
  onInitialTabApplied,
}) => {
  const modal = useStudentDetailModal({
    student,
    isOpen,
    initialTab,
    onInitialTabApplied,
    onClose,
    onEdit,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl lg:max-w-6xl overflow-hidden sm:my-4 flex flex-col max-h-[90vh]">
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
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${modal.statusBadge.bg}`}>
                  {modal.statusBadge.label}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${modal.levelColor}`}>
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
            {modal.primaryGuardian?.parentPhone && (
              <a
                href={`tel:${modal.primaryGuardian.parentPhone}`}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">학부모</span> 전화
              </a>
            )}
            <>
              <button
                onClick={() => onEdit(student)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                title="원생 정보 수정"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={modal.handleDelete}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 transition-colors"
                title="원생 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <nav className="hidden lg:flex flex-col w-52 shrink-0 border-r border-slate-200 bg-slate-50/60 overflow-y-auto py-2">
            {modal.tabConfig.map((tab) => {
              const isActive = modal.currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => modal.setCurrentTab(tab.id)}
                  className={`mx-2 px-3 py-2.5 text-xs font-bold flex items-center gap-2 rounded-xl transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="lg:hidden flex items-center gap-1 px-4 sm:px-6 border-b border-slate-200 bg-white overflow-x-auto shrink-0 scrollbar-none">
              {modal.tabConfig.map((tab) => {
                const isActive = modal.currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => modal.setCurrentTab(tab.id)}
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

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
              {modal.currentTab === 'info' && (
                <StudentDetailInfoTab
                  student={student}
                  guardians={modal.guardians}
                  totalPracticeMinutes={modal.totalPracticeMinutes}
                  attendanceEnabled={modal.attendanceEnabled}
                  isAdmin={modal.isAdmin}
                  isSupabaseConfigured={modal.isSupabaseConfigured}
                  levelLabel={modal.industryPlugin.levelLabel}
                  showPickupFields={modal.industryPlugin.showPickupFields}
                  onEdit={onEdit}
                  onOpenGuardianLink={() => modal.setGuardianLinkOpen(true)}
                />
              )}

              {modal.currentTab === 'classes' && (
                <StudentDetailClassesTab enrolledClasses={modal.enrolledClasses} />
              )}

              {modal.currentTab === 'attendance' && (
                <StudentDetailAttendanceTab
                  allAttendance={modal.allAttendance}
                  totalAttCount={modal.totalAttCount}
                  presentCount={modal.presentCount}
                  attRate={modal.attRate}
                  isAddAttOpen={modal.attendance.isAddAttOpen}
                  setIsAddAttOpen={modal.attendance.setIsAddAttOpen}
                  newAttDate={modal.attendance.newAttDate}
                  setNewAttDate={modal.attendance.setNewAttDate}
                  newAttStatus={modal.attendance.newAttStatus}
                  setNewAttStatus={modal.attendance.setNewAttStatus}
                  newAttMemo={modal.attendance.newAttMemo}
                  setNewAttMemo={modal.attendance.setNewAttMemo}
                  onSaveAttendance={modal.attendance.onSave}
                />
              )}

              {modal.currentTab === 'tuition' && (
                <StudentDetailTuitionTab
                  allInvoices={modal.allInvoices}
                  payInvoiceId={modal.tuition.payInvoiceId}
                  setPayInvoiceId={modal.tuition.setPayInvoiceId}
                  payAmount={modal.tuition.payAmount}
                  setPayAmount={modal.tuition.setPayAmount}
                  payMethod={modal.tuition.payMethod}
                  setPayMethod={modal.tuition.setPayMethod}
                  payMemo={modal.tuition.payMemo}
                  setPayMemo={modal.tuition.setPayMemo}
                  onCreateInvoice={modal.tuition.onCreateInvoice}
                  onOpenPayModal={modal.tuition.onOpenPayModal}
                  onProcessPayment={modal.tuition.onProcessPayment}
                />
              )}

              {modal.currentTab === 'textbooks' && (
                <StudentDetailTextbooksTab
                  studentSales={modal.studentSales}
                  billingSummary={modal.billingSummary}
                  onOpenSaleModal={() => modal.textbooks.setIsStudentSaleModalOpen(true)}
                  onOpenPaymentModal={(sale) => {
                    modal.textbooks.setSelectedStudentSaleForPay(sale);
                    modal.textbooks.setIsStudentTbPaymentModalOpen(true);
                  }}
                  onOpenReceiptModal={(sale) => {
                    modal.textbooks.setTbReceiptSale(sale);
                    modal.textbooks.setIsTbReceiptOpen(true);
                  }}
                />
              )}

              {modal.currentTab === 'consultations' && (
                <StudentDetailConsultationsTab
                  allConsultations={modal.allConsultations}
                  isAddCstOpen={modal.consultations.isAddCstOpen}
                  setIsAddCstOpen={modal.consultations.setIsAddCstOpen}
                  newCstType={modal.consultations.newCstType}
                  setNewCstType={modal.consultations.setNewCstType}
                  newCstContent={modal.consultations.newCstContent}
                  setNewCstContent={modal.consultations.setNewCstContent}
                  newCstResult={modal.consultations.newCstResult}
                  setNewCstResult={modal.consultations.setNewCstResult}
                  newCstNextDate={modal.consultations.newCstNextDate}
                  setNewCstNextDate={modal.consultations.setNewCstNextDate}
                  onSaveConsultation={modal.consultations.onSave}
                />
              )}

              {modal.currentTab === 'practice' && (
                <StudentDetailPracticeTab
                  allPractice={modal.allPractice}
                  allLessons={modal.allLessons}
                  totalPracticeMinutes={modal.totalPracticeMinutes}
                  isAddPrOpen={modal.practice.isAddPrOpen}
                  setIsAddPrOpen={modal.practice.setIsAddPrOpen}
                  newPrDate={modal.practice.newPrDate}
                  setNewPrDate={modal.practice.setNewPrDate}
                  newPrMinutes={modal.practice.newPrMinutes}
                  setNewPrMinutes={modal.practice.setNewPrMinutes}
                  newPrSong={modal.practice.newPrSong}
                  setNewPrSong={modal.practice.setNewPrSong}
                  newPrDifficulty={modal.practice.newPrDifficulty}
                  setNewPrDifficulty={modal.practice.setNewPrDifficulty}
                  onSavePractice={modal.practice.onSave}
                />
              )}

              {modal.currentTab === 'videos' && (
                <StudentDetailVideosTab
                  allVideos={modal.allVideos}
                  recitalEvents={modal.recitalEvents}
                  videoTypeLabel={modal.videos.videoTypeLabel}
                  isAddVideoOpen={modal.videos.isAddVideoOpen}
                  setIsAddVideoOpen={modal.videos.setIsAddVideoOpen}
                  newVideoTitle={modal.videos.newVideoTitle}
                  setNewVideoTitle={modal.videos.setNewVideoTitle}
                  newVideoUrl={modal.videos.newVideoUrl}
                  setNewVideoUrl={modal.videos.setNewVideoUrl}
                  newVideoDate={modal.videos.newVideoDate}
                  setNewVideoDate={modal.videos.setNewVideoDate}
                  newVideoType={modal.videos.newVideoType}
                  setNewVideoType={modal.videos.setNewVideoType}
                  newVideoEventId={modal.videos.newVideoEventId}
                  setNewVideoEventId={modal.videos.setNewVideoEventId}
                  newVideoSong={modal.videos.newVideoSong}
                  setNewVideoSong={modal.videos.setNewVideoSong}
                  newVideoMemo={modal.videos.newVideoMemo}
                  setNewVideoMemo={modal.videos.setNewVideoMemo}
                  previewVideoId={modal.videos.previewVideoId}
                  setPreviewVideoId={modal.videos.setPreviewVideoId}
                  onSaveVideo={modal.videos.onSave}
                  onVideoEventChange={modal.videos.onEventChange}
                  onDeleteVideo={modal.videos.onDelete}
                />
              )}

              {modal.currentTab === 'memo' && <StudentDetailMemoTab student={student} />}
            </div>
          </div>
        </div>
      </div>

      {modal.textbooks.isStudentSaleModalOpen && (
        <NewSaleModal
          initialStudentId={student.id}
          onSuccess={() => {
            modal.textbooks.setIsStudentSaleModalOpen(false);
            modal.triggerRefresh();
          }}
          onClose={() => modal.textbooks.setIsStudentSaleModalOpen(false)}
        />
      )}

      {modal.textbooks.isStudentTbPaymentModalOpen && modal.textbooks.selectedStudentSaleForPay && (
        <TextbookPaymentModal
          sale={modal.textbooks.selectedStudentSaleForPay}
          onSuccess={() => {
            modal.textbooks.setIsStudentTbPaymentModalOpen(false);
            modal.triggerRefresh();
          }}
          onClose={() => modal.textbooks.setIsStudentTbPaymentModalOpen(false)}
        />
      )}

      {modal.textbooks.isTbReceiptOpen && modal.textbooks.tbReceiptSale && (
        <TextbookReceiptModal
          sale={modal.textbooks.tbReceiptSale}
          onClose={() => modal.textbooks.setIsTbReceiptOpen(false)}
        />
      )}

      <GuardianLinkInviteModal
        studentId={student.id}
        studentName={student.name}
        isOpen={modal.guardianLinkOpen}
        onClose={() => modal.setGuardianLinkOpen(false)}
      />
    </div>
  );
};
