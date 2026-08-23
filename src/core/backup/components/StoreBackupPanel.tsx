import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  downloadStoreBackupFile,
  getDaysSinceLastBackup,
  getLastStoreBackupAt,
  restoreStoreBackupJson,
  shouldRemindBackup,
} from '../storeBackup';
import { Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react';

interface StoreBackupPanelProps {
  className?: string;
}

export const StoreBackupPanel: React.FC<StoreBackupPanelProps> = ({ className = '' }) => {
  const { showToast } = useApp();
  const [lastBackupAt, setLastBackupAt] = useState(() => getLastStoreBackupAt());
  const daysSince = useMemo(() => getDaysSinceLastBackup(), [lastBackupAt]);
  const needsReminder = shouldRemindBackup(7);

  const handleDownload = () => {
    const { fileName, exportedAt } = downloadStoreBackupFile();
    setLastBackupAt(exportedAt);
    showToast(`백업 파일이 컴퓨터에 저장되었습니다. (${fileName})`, 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = restoreStoreBackupJson(content);
        if (success) {
          showToast('데이터 복원이 완료되었습니다. 페이지를 새로고침합니다.', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('유효하지 않은 백업 파일 형식입니다.', 'error');
        }
      } catch {
        showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className={`bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 ${className}`}
    >
      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        매장 데이터 백업 (컴퓨터 저장)
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        고객·예약·상품·재무 등 이 매장의 전체 데이터를 JSON 파일로 내려받아 개인 컴퓨터에
        보관하세요. 기기 변경·브라우저 초기화 시 복원에 사용합니다.
      </p>

      {needsReminder && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {daysSince === null
              ? '아직 이 기기에서 백업을 받은 기록이 없습니다. 지금 다운로드를 권장합니다.'
              : `마지막 백업 후 ${daysSince}일이 지났습니다. 주기적으로 백업 파일을 받아 두세요.`}
          </span>
        </div>
      )}

      {lastBackupAt && !needsReminder && (
        <p className="text-[11px] text-slate-400">
          최근 백업: {lastBackupAt.slice(0, 19).replace('T', ' ')}
        </p>
      )}

      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" />
          지금 백업 파일 다운로드
        </button>

        <label className="w-full py-3 min-h-[44px] bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4 text-indigo-600" />
          <span>백업 파일로 복원</span>
          <input type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
        </label>
      </div>
    </div>
  );
};
