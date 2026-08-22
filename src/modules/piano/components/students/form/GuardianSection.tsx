import React from 'react';
import {
  Phone,
  Mail,
  UserPlus,
  Link2,
  Trash2,
  Search,
} from 'lucide-react';
import type { Parent } from '@/types';
import type { GuardianRelationship } from '@/core/parent/types';
import {
  getParentChildNames,
  GUARDIAN_RELATIONSHIP_LABELS,
} from '@/core/parent/guardianHelpers';
import type { GuardianFormEntry } from './studentFormTypes';
import { RELATIONSHIP_OPTIONS } from './studentFormTypes';

interface Props {
  isEdit: boolean;
  canInviteParent: boolean;
  guardians: GuardianFormEntry[];
  activeSearchIdx: number | null;
  searchResults: Parent[];
  onAddGuardian: () => void;
  onUpdateGuardian: (idx: number, patch: Partial<GuardianFormEntry>) => void;
  onSetPrimary: (idx: number) => void;
  onRemoveGuardian: (idx: number) => void;
  onSelectExistingParent: (idx: number, parent: Parent) => void;
  onFocusSearch: (idx: number) => void;
}

export const GuardianSection: React.FC<Props> = ({
  isEdit,
  canInviteParent,
  guardians,
  activeSearchIdx,
  searchResults,
  onAddGuardian,
  onUpdateGuardian,
  onSetPrimary,
  onRemoveGuardian,
  onSelectExistingParent,
  onFocusSearch,
}) => (
  <section>
    <div className="flex items-center justify-between mb-3">
      <div>
        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> 학부모 연결
        </h4>
        {isEdit && (
          <p className="text-[11px] text-slate-500 mt-1">
            부·모 각각 별도 계정으로 연결할 수 있습니다. 보호자 추가 후 저장하면 link가 반영됩니다.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onAddGuardian}
        className="text-xs font-bold text-indigo-600 flex items-center gap-1 shrink-0 min-h-[44px] px-2"
      >
        <UserPlus className="w-3.5 h-3.5" /> 보호자 추가
      </button>
    </div>

    <div className="space-y-4">
      {guardians.map((g, idx) => (
        <div key={g.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              보호자 {idx + 1}
              {g.isPrimary && (
                <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">
                  주 보호자
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {!g.isPrimary && (
                <button
                  type="button"
                  onClick={() => onSetPrimary(idx)}
                  className="text-[10px] text-indigo-600 font-bold"
                >
                  주 보호자로
                </button>
              )}
              {guardians.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveGuardian(idx)}
                  className="text-rose-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="연결 해제"
                  aria-label="보호자 연결 해제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdateGuardian(idx, { mode: 'existing' })}
              className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                g.mode === 'existing'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Link2 className="w-3 h-3 inline mr-1" />
              기존 학부모
            </button>
            <button
              type="button"
              onClick={() => onUpdateGuardian(idx, { mode: 'new', existingParentId: '' })}
              className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                g.mode === 'new'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <UserPlus className="w-3 h-3 inline mr-1" />
              새 학부모
            </button>
          </div>

          {g.mode === 'existing' ? (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="이름·전화·자녀명으로 검색"
                value={g.parentSearch}
                onFocus={() => onFocusSearch(idx)}
                onChange={(e) =>
                  onUpdateGuardian(idx, {
                    parentSearch: e.target.value,
                    existingParentId: '',
                  })
                }
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              />
              {activeSearchIdx === idx && searchResults.length > 0 && (
                <div className="absolute z-10 inset-x-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectExistingParent(idx, p)}
                      className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 border-b border-slate-50 last:border-0"
                    >
                      <p className="text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.phone}</p>
                      <p className="text-[10px] text-indigo-600">
                        자녀: {getParentChildNames(p).join(', ') || '없음'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="학부모 이름 *"
                value={g.name}
                onChange={(e) => onUpdateGuardian(idx, { name: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              />
              <input
                type="tel"
                placeholder="전화번호 *"
                value={g.phone}
                onChange={(e) => onUpdateGuardian(idx, { phone: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">관계</label>
              <select
                value={g.relationship}
                onChange={(e) =>
                  onUpdateGuardian(idx, { relationship: e.target.value as GuardianRelationship })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {GUARDIAN_RELATIONSHIP_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3" /> 이메일
              </label>
              <input
                type="email"
                value={g.email}
                onChange={(e) => onUpdateGuardian(idx, { email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              />
            </div>
          </div>

          {canInviteParent && g.mode === 'new' && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={g.invite}
                onChange={(e) => onUpdateGuardian(idx, { invite: e.target.checked })}
                disabled={!g.email.trim()}
              />
              등록과 동시에 학부모 포털 초대
            </label>
          )}
        </div>
      ))}
    </div>
  </section>
);
