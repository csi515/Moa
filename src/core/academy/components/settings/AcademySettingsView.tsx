import { useRef, useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageService } from '@/services/storage';
import { PageHeader } from '@/shared/components';
import {
  FormField,
  FORM_CONTROL_CLASS,
  SettingsCard,
} from '@/shared/components/ui';
import { AcademySettings } from '@/types';
import {
  AttendanceFeatureToggle,
  isAttendanceModuleEnabled,
  withAttendanceModuleEnabled,
} from '@/core/attendance';
import { IndustryFeatureGuidePanel } from '@/core/help';
import { LegalLinks } from '@/core/legal';
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  ShieldCheck,
  Loader2,
  Trash2,
  AlertTriangle,
  DoorOpen,
  Plus,
  BookOpen,
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { getIndustryAccent } from '@/core/industry/industryUi';
import * as orgService from '@/core/organizations/services/organizationService';
import {
  ACADEMY_ROOM_KIND_LABEL,
  createAcademyRoom,
  getConfiguredRooms,
} from '@/core/academy/utils/academyRooms';
import type { AcademyRoomKind } from '@/types';
export const AcademySettingsView: FC = () => {
  const { showToast, triggerRefresh, openConfirmDialog, setActiveTab } = useApp();
  const { industry, isOwner } = usePermissions();
  const org = useOrganization();
  const importInputRef = useRef<HTMLInputElement>(null);
  const pendingImportRef = useRef<File | null>(null);

  const accent = getIndustryAccent(industry);
  const accentBtn = `${accent.btn} ${accent.btnHover}`;
  const accentIcon = accent.icon;
  const accentHover = accent.hoverBg;

  const [settings, setSettings] = useState<AcademySettings>(() => StorageService.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industry);
  const rooms = getConfiguredRooms(settings);

  const updateRoom = (id: string, patch: { name?: string; kind?: AcademyRoomKind }) => {
    setSettings({
      ...settings,
      rooms: rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const addRoom = () => {
    setSettings({
      ...settings,
      rooms: [...rooms, createAcademyRoom({ name: `강의실 ${rooms.length + 1}` })],
    });
  };

  const removeRoom = (id: string) => {
    setSettings({
      ...settings,
      rooms: rooms.filter((r) => r.id !== id),
    });
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      StorageService.saveSettings({
        ...settings,
        rooms: getConfiguredRooms(settings),
      });
      
      if (org.currentOrganization) {
        await orgService.updateOrganization(org.currentOrganization.id, {
          name: settings.name,
          settings: {
            directorName: settings.directorName,
            phone: settings.phone,
            businessNumber: settings.businessNumber,
            address: settings.address,
            defaultTuitionFee: settings.defaultTuitionFee,
            defaultPaymentDay: settings.defaultPaymentDay,
            bankAccount: settings.bankAccount,
            features: settings.features,
            rooms: getConfiguredRooms(settings),
          },
        });
        
        await org.refreshOrganizations();
      }
      
      triggerRefresh();
      showToast('사업장 설정이 저장되었습니다.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '설정 저장 중 오류가 발생했습니다.',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('학원 전체 데이터 백업 파일이 다운로드되었습니다.', 'success');
  };

  const runImport = (file: File) => {
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = StorageService.importAllData(content);
        if (success) {
          showToast('데이터 복원이 완료되었습니다. 페이지를 새로고침합니다.', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          showToast('유효하지 않은 백업 파일 형식입니다.', 'error');
        }
      } catch {
        showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
      } finally {
        setIsImporting(false);
        pendingImportRef.current = null;
      }
    };
    reader.onerror = () => {
      showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
      setIsImporting(false);
      pendingImportRef.current = null;
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    pendingImportRef.current = file;
    openConfirmDialog({
      title: '백업 파일 복원',
      message:
        '현재 저장된 모든 데이터가 백업 파일 내용으로 교체됩니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?',
      isDestructive: true,
      confirmText: '복원',
      onConfirm: () => {
        const pending = pendingImportRef.current;
        if (pending) runImport(pending);
      },
      onCancel: () => {
        pendingImportRef.current = null;
      },
    });
  };

  const handleDeleteOrganization = async () => {
    if (!org.currentOrganization) return;
    if (deleteConfirmName !== org.currentOrganization.name) {
      showToast('조직명이 일치하지 않습니다.', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      await orgService.deleteOrganization(org.currentOrganization.id);
      
      showToast('조직이 삭제되었습니다.', 'success');
      setShowDeleteModal(false);
      
      await org.refreshOrganizations();
      
      if (org.organizations.length > 1) {
        const otherOrg = org.organizations.find(
          (m) => m.organizationId !== org.currentOrganization?.id
        );
        if (otherOrg) {
          org.selectOrganization(otherOrg.organizationId);
        } else {
          org.clearOrganization();
        }
      } else {
        org.clearOrganization();
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '조직 삭제 중 오류가 발생했습니다.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        icon={<Settings className="w-6 h-6" />}
        iconClassName={accentIcon}
        title="사업장 운영 및 환경 설정"
        description="기본 정보, 출입 관리, 백업, 업종별 기능 설명서"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsCard
          className="lg:col-span-2 sm:p-8"
          title="학원 기본 프로필"
          icon={<Building className={`w-4 h-4 ${accentIcon}`} />}
        >
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="학원명" required>
                <input
                  type="text"
                  required
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className={`${FORM_CONTROL_CLASS} font-bold`}
                />
              </FormField>

              <FormField label="원장님 성명" required>
                <input
                  type="text"
                  required
                  value={settings.directorName}
                  onChange={(e) => setSettings({ ...settings, directorName: e.target.value })}
                  className={`${FORM_CONTROL_CLASS} font-bold`}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="학원 대표 전화번호" required>
                <input
                  type="tel"
                  required
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className={`${FORM_CONTROL_CLASS} font-mono`}
                />
              </FormField>

              <FormField label="사업자 등록번호 (선택)">
                <input
                  type="text"
                  value={settings.businessNumber || ''}
                  onChange={(e) => setSettings({ ...settings, businessNumber: e.target.value })}
                  className={`${FORM_CONTROL_CLASS} font-mono`}
                />
              </FormField>
            </div>

            <FormField label="학원 소재지 주소">
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className={FORM_CONTROL_CLASS}
              />
            </FormField>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="기본 월 수강료 기준 (₩)">
                <CurrencyInput
                  value={settings.defaultTuitionFee}
                  onChange={(val) => setSettings({ ...settings, defaultTuitionFee: val })}
                  showQuickButtons
                />
              </FormField>

              <FormField label="기본 결제일">
                <select
                  value={settings.defaultPaymentDay}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultPaymentDay: Number(e.target.value) })
                  }
                  className={`${FORM_CONTROL_CLASS} font-bold`}
                >
                  <option value={1}>매월 1일</option>
                  <option value={5}>매월 5일</option>
                  <option value={10}>매월 10일</option>
                  <option value={15}>매월 15일</option>
                  <option value={20}>매월 20일</option>
                  <option value={25}>매월 25일</option>
                </select>
              </FormField>
            </div>

            <FormField label="수납용 계좌번호 안내 (영수증 및 청구서에 표기)">
              <input
                type="text"
                placeholder="예: 국민은행 123456-04-123456 (예금주: 선율음악학원)"
                value={settings.bankAccount || ''}
                onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                className={FORM_CONTROL_CLASS}
              />
            </FormField>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <DoorOpen className={`w-4 h-4 ${accentIcon}`} />
                  <p className="text-sm font-bold text-slate-800">강의실 · 연습실</p>
                </div>
                <button
                  type="button"
                  onClick={addRoom}
                  className={`inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-bold rounded-xl ${accent.hoverBg} ${accentIcon}`}
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                반 개설·보강 예약 시 선택할 공간입니다. 학원에서 쓰는 실 이름을 등록해 주세요.
              </p>
              {rooms.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  등록된 실이 없습니다. 추가하거나 온보딩에서 설정해 주세요.
                </p>
              ) : (
                <ul className="space-y-2">
                  {rooms.map((room) => (
                    <li
                      key={room.id}
                      className="flex flex-col sm:flex-row gap-2 sm:items-center rounded-xl border border-slate-100 bg-slate-50/80 p-2.5"
                    >
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                        className={`${FORM_CONTROL_CLASS} flex-1 min-h-[44px]`}
                        placeholder="예: 피아노 1실"
                      />
                      <select
                        value={room.kind}
                        onChange={(e) =>
                          updateRoom(room.id, { kind: e.target.value as AcademyRoomKind })
                        }
                        className={`${FORM_CONTROL_CLASS} sm:w-32 min-h-[44px]`}
                      >
                        <option value="classroom">{ACADEMY_ROOM_KIND_LABEL.classroom}</option>
                        <option value="practice">{ACADEMY_ROOM_KIND_LABEL.practice}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeRoom(room.id)}
                        className="p-2.5 min-h-[44px] min-w-[44px] text-rose-500 hover:bg-rose-50 rounded-xl"
                        aria-label={`${room.name} 삭제`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {industry === 'piano' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('textbooks')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 min-h-[44px]"
                >
                  <BookOpen className="w-4 h-4" />
                  사용 교재는 교재 관리에서 등록
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <AttendanceFeatureToggle
                enabled={attendanceEnabled}
                onChange={(enabled) => setSettings(withAttendanceModuleEnabled(settings, enabled))}
                activeClassName={accent.btn}
                iconClassName={accentIcon}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-2.5 min-h-[44px] ${accentBtn} disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? '저장 중…' : '설정 정보 저장'}
              </button>
            </div>
          </form>
        </SettingsCard>

        <div className="space-y-6">
          <SettingsCard
            title="데이터 안전 백업 및 복원"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          >
            <p className="text-xs text-slate-500 leading-relaxed">
              원생, 출결, 수강료 등 학원 데이터를 JSON 파일로 백업하거나, 다른 기기에서 복원할 수 있습니다.
              정기적인 백업으로 데이터 손실을 예방하세요.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                disabled={isImporting}
                className={`w-full py-3 min-h-[44px] bg-slate-50 ${accentHover} border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
              >
                <Download className={`w-4 h-4 ${accentIcon}`} />
                전체 데이터 백업 (JSON 다운로드)
              </button>

              <button
                type="button"
                disabled={isImporting}
                onClick={() => importInputRef.current?.click()}
                className={`w-full py-3 min-h-[44px] bg-slate-50 ${accentHover} border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
              >
                {isImporting ? (
                  <Loader2 className={`w-4 h-4 animate-spin ${accentIcon}`} />
                ) : (
                  <Upload className={`w-4 h-4 ${accentIcon}`} />
                )}
                {isImporting ? '복원 중…' : '백업 파일 복원 (JSON 업로드)'}
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </SettingsCard>

          <div className="pt-2 pb-4">
            <p className="text-xs text-slate-500 text-center mb-2">
              계정 탈퇴는 <strong>내 계정</strong> 메뉴에서 진행할 수 있습니다.
            </p>
            <LegalLinks className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-500" />
          </div>

          {isOwner && org.currentOrganization && (
            <SettingsCard
              title="위험 영역"
              icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
            >
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-xs text-rose-800 leading-relaxed">
                    <strong>조직을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</strong>
                    <br />
                    원생, 출결, 수강료, 강사 등 모든 정보가 복구 불가능하게 삭제됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-3 min-h-[44px] bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-700 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  조직 영구 삭제
                </button>
              </div>
            </SettingsCard>
          )}
        </div>
      </div>

      <IndustryFeatureGuidePanel industry={industry} />

      {showDeleteModal && org.currentOrganization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-rose-100 bg-rose-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">조직 영구 삭제</h2>
                <p className="text-xs text-rose-600">이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-rose-700">{org.currentOrganization.name}</strong> 조직과 관련된
                  모든 데이터가 영구적으로 삭제됩니다.
                </p>
                <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                  <li>모든 원생 및 학부모 정보</li>
                  <li>출석 및 수업 기록</li>
                  <li>수강료 및 결제 내역</li>
                  <li>강사 및 수업 정보</li>
                  <li>공지사항 및 기타 데이터</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  삭제를 확인하려면 조직명을 정확히 입력하세요:
                </label>
                <div className="p-2 bg-slate-100 rounded-lg mb-3">
                  <p className="text-sm font-bold text-slate-900 text-center">
                    {org.currentOrganization.name}
                  </p>
                </div>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="조직명을 입력하세요"
                  className="w-full px-3 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmName('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOrganization}
                  disabled={isDeleting || deleteConfirmName !== org.currentOrganization.name}
                  className="flex-1 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      영구 삭제
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
