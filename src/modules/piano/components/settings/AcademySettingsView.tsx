import { useRef, useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
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
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { getIndustryAccent } from '@/core/industry/industryUi';

export const AcademySettingsView: FC = () => {
  const { showToast, triggerRefresh, openConfirmDialog } = useApp();
  const { industry } = usePermissions();
  const importInputRef = useRef<HTMLInputElement>(null);
  const pendingImportRef = useRef<File | null>(null);

  const accent = getIndustryAccent(industry);
  const accentBtn = `${accent.btn} ${accent.btnHover}`;
  const accentIcon = accent.icon;
  const accentHover = accent.hoverBg;

  const [settings, setSettings] = useState<AcademySettings>(() => StorageService.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industry);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      StorageService.saveSettings(settings);
      triggerRefresh();
      showToast('사업장 설정이 저장되었습니다.', 'success');
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

  return (
    <div className="space-y-6 pb-12">
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
              원생 정보, 출결 기록, 수강료 청구 및 지출 등 학원의 모든 데이터를 JSON 파일로
              다운로드하거나 다른 기기에서 복원할 수 있습니다.
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
        </div>
      </div>

      <IndustryFeatureGuidePanel industry={industry} />
    </div>
  );
};
