import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { AcademySettings } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Phone,
  MapPin,
  CreditCard
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

export const AcademySettingsView: React.FC = () => {
  const { showToast, openConfirmDialog } = useApp();

  const [settings, setSettings] = useState<AcademySettings>(() => StorageService.getSettings());

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    showToast('학원 기본 정보가 안전하게 저장되었습니다.', 'success');
  };

  // Export JSON Backup
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

  // Import JSON Backup
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
      } catch (err) {
        showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Reset to initial sample data
  const handleResetData = () => {
    openConfirmDialog({
      title: '데이터 초기화',
      message: '모든 데이터를 기본 초기 샘플 데이터로 복원하시겠습니까? 현재 입력된 변경사항은 덮어씌워집니다.',
      isDestructive: true,
      confirmText: '초기화 실행',
      onConfirm: () => {
        StorageService.resetToInitialData();
        showToast('기본 샘플 데이터로 초기화되었습니다.', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            학원 운영 및 환경 설정
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            학원명, 대표자 정보, 수납 계좌, 수강료 기본값 및 데이터 백업/복원
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            학원 기본 프로필
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학원명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  원장님 성명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.directorName}
                  onChange={(e) => setSettings({ ...settings, directorName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학원 대표 전화번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  사업자 등록번호 (선택)
                </label>
                <input
                  type="text"
                  value={settings.businessNumber || ''}
                  onChange={(e) => setSettings({ ...settings, businessNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학원 소재지 주소
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  기본 월 수강료 기준 (₩)
                </label>
                <CurrencyInput
                  value={settings.defaultTuitionFee}
                  onChange={(val) => setSettings({ ...settings, defaultTuitionFee: val })}
                  showQuickButtons
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  기본 결제일
                </label>
                <select
                  value={settings.defaultPaymentDay}
                  onChange={(e) => setSettings({ ...settings, defaultPaymentDay: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                >
                  <option value={1}>매월 1일</option>
                  <option value={5}>매월 5일</option>
                  <option value={10}>매월 10일</option>
                  <option value={15}>매월 15일</option>
                  <option value={20}>매월 20일</option>
                  <option value={25}>매월 25일</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                수납용 계좌번호 안내 (영수증 및 청구서에 표기)
              </label>
              <input
                type="text"
                placeholder="예: 국민은행 123456-04-123456 (예금주: 선율음악학원)"
                value={settings.bankAccount || ''}
                onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
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
        </div>

        {/* Data Backup & Restore Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              데이터 안전 백업 및 복원
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              원생 정보, 출결 기록, 수강료 청구 및 지출 등 학원의 모든 데이터를 JSON 파일로 다운로드하거나 다른 기기에서 복원할 수 있습니다.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportData}
                className="w-full py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                전체 데이터 백업 (JSON 다운로드)
              </button>

              <label className="w-full py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>백업 파일 복원 (JSON 업로드)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Panel */}
          <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-200 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              샘플 데이터 초기화
            </h4>
            <p className="text-xs text-rose-700 leading-relaxed">
              체험용 초기 데이터로 되돌리려면 아래 초기화 버튼을 누르세요.
            </p>
            <button
              onClick={handleResetData}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              기본 샘플 데이터로 복원
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
