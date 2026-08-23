import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { downloadStoreBackupFile, shouldRemindBackup } from '../storeBackup';
import { Download } from 'lucide-react';

/** 헤더에서 언제든 매장 백업 파일을 컴퓨터에 저장 */
export const HeaderBackupButton: React.FC = () => {
  const { showToast } = useApp();
  const { isAdmin, isOwner } = usePermissions();
  const [busy, setBusy] = useState(false);

  if (!isAdmin && !isOwner) return null;

  const remind = shouldRemindBackup(7);

  const handleClick = () => {
    if (busy) return;
    setBusy(true);
    try {
      const { fileName } = downloadStoreBackupFile();
      showToast(`백업 파일이 컴퓨터에 저장되었습니다. (${fileName})`, 'success');
    } catch {
      showToast('백업 다운로드에 실패했습니다.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title="매장 데이터 백업 파일을 컴퓨터에 저장"
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[44px] min-w-[44px] sm:min-w-0 justify-center text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
        remind
          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
      }`}
    >
      <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      <span className="hidden sm:inline">백업</span>
    </button>
  );
};
