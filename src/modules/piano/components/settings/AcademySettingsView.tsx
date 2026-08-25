import { useState } from 'react';
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
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

export const AcademySettingsView: React.FC = () => {
  const { showToast, triggerRefresh } = useApp();
  const { industry } = usePermissions();

  const [settings, setSettings] = useState<AcademySettings>(() => StorageService.getSettings());
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industry);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    triggerRefresh();
    showToast('사업장 설정이 저장되었습니다.', 'success');
  };

  const handleExportData = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piano_academy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('학원 전체 데이터 백업 파일이 다운로드되었습니다.', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Settings className="w-6 h-6" />}
        title="사업장 운영 및 환경 설정"
        description="기본 정보, 출입 관리, 백업, 업종별 기능 설명서"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsCard
          className="lg:col-span-2 sm:p-8"
          title="학원 기본 프로필"
          icon={<Building className="w-4 h-4 text-indigo-600" />}
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
                activeClassName={industry === 'pilates' ? 'bg-teal-600' : 'bg-indigo-600'}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                설정 정보 저장
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
                className="w-full py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                전체 데이터 백업 (JSON 다운로드)
              </button>

              <label className="w-full py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>백업 파일 복원 (JSON 업로드)</span>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </SettingsCard>
        </div>
      </div>

      <IndustryFeatureGuidePanel industry={industry} />
    </div>
  );
};
