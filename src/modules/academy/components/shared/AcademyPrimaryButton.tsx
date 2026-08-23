import React, { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface Props {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

/** PageHeader 액션용 primary 버튼 */
export const AcademyPrimaryButton: React.FC<Props> = ({ label, onClick, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2"
  >
    {icon ?? <Plus className="w-4 h-4" />}
    {label}
  </button>
);
