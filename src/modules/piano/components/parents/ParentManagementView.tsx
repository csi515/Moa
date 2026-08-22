import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import {
  fetchParentAccountStatuses,
  inviteParentMember,
  revokeParentInvitation,
  syncAllParentStudentLinks,
  type ParentAccountStatus,
  type ParentAccountStatusItem,
} from '@/core/parent/services/parentAccountService';
import { formatGuardianRelationship } from '@/core/parent';
import { StorageService } from '@/services/storage';
import { Parent } from '@/types';
import { formatPhone, getLevelColor } from '@/utils/formatters';
import { PageHeader, FilterBar, SearchField } from '@/shared/components';
import {
  UserSquare2,
  Phone,
  Users,
  Mail,
  Link2,
  Loader2,
  X,
} from 'lucide-react';

function getAccountStatusLabel(status: ParentAccountStatus): string {
  const labels = { none: '미연결', invited: '초대됨', connected: '연결됨' };
  return labels[status];
}

function getAccountStatusClass(status: ParentAccountStatus): string {
  const classes = {
    none: 'bg-slate-100 text-slate-600',
    invited: 'bg-amber-50 text-amber-700',
    connected: 'bg-emerald-50 text-emerald-700',
  };
  return classes[status];
}

export const ParentManagementView: React.FC = () => {
  const { setSelectedStudentId, setActiveTab, showToast, refreshKey } = useApp();
  const { currentOrganization, currentRole } = useOrganization();
  const canInvite = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'manager';

  const [searchQuery, setSearchQuery] = useState('');
  const [accountStatuses, setAccountStatuses] = useState<ParentAccountStatusItem[]>([]);
  const [inviteTarget, setInviteTarget] = useState<Parent | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    StorageService.syncParentsFromStudents();
  }, [refreshKey]);

  const parents = StorageService.getParents();
  const students = StorageService.getStudents();
  const parentLinks = StorageService.getParentStudentLinks();

  const getChildRelationship = (parentId: string, studentId: string) => {
    const link = parentLinks.find((l) => l.parentId === parentId && l.studentId === studentId);
    return link ? formatGuardianRelationship(link.relationship) : null;
  };

  const loadStatuses = useCallback(async () => {
    if (!currentOrganization?.id || !canInvite) return;
    try {
      const statuses = await fetchParentAccountStatuses(currentOrganization.id);
      setAccountStatuses(statuses);
    } catch {
      /* offline fallback */
    }
  }, [currentOrganization?.id, canInvite]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses, refreshKey]);

  const statusMap = useMemo(
    () => new Map(accountStatuses.map((s) => [s.parentCustomerId, s])),
    [accountStatuses]
  );

  const filteredParents = parents.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const childNames = p.studentIds
      .map((id) => students.find((s) => s.id === id)?.name || '')
      .join(' ');
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      childNames.toLowerCase().includes(q)
    );
  });

  const resolveStatus = (parent: Parent): ParentAccountStatus => {
    return statusMap.get(parent.id)?.status || 'none';
  };

  const handleInvite = async () => {
    if (!inviteTarget || !currentOrganization?.id || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await syncAllParentStudentLinks(currentOrganization.id);
      await inviteParentMember(currentOrganization.id, inviteTarget.id, inviteEmail.trim());
      showToast(`${inviteTarget.name} 학부모에게 초대가 등록되었습니다.`, 'success');
      setInviteTarget(null);
      setInviteEmail('');
      await loadStatuses();
    } catch (e: any) {
      showToast(e?.message || '초대에 실패했습니다.', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (parent: Parent) => {
    if (!currentOrganization?.id) return;
    try {
      await revokeParentInvitation(currentOrganization.id, parent.id);
      showToast('초대가 취소되었습니다.', 'info');
      await loadStatuses();
    } catch {
      showToast('초대 취소에 실패했습니다.', 'error');
    }
  };

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<UserSquare2 className="w-6 h-6" />}
        title="학부모 관리"
        description="학부모 계정을 초대하면 출결·과제·리포트를 학부모 앱에서 확인할 수 있습니다."
      />

      <FilterBar>
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="학부모 이름, 연락처, 원생 이름 검색..."
          className="flex-1 min-w-[200px]"
        />
      </FilterBar>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParents.map((parent) => {
          const status = resolveStatus(parent);
          const parentStudents = parent.studentIds
            .map((id) => students.find((s) => s.id === id))
            .filter(Boolean);

          return (
            <div
              key={parent.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {parent.name.slice(0, 1) || '학'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{parent.name}</h4>
                    <p className="font-mono text-xs text-indigo-600 font-semibold mt-0.5">
                      {formatPhone(parent.phone)}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${getAccountStatusClass(status)}`}>
                      {getAccountStatusLabel(status)}
                    </span>
                  </div>
                </div>
                <a
                  href={`tel:${parent.phone}`}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {canInvite && status !== 'connected' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setInviteTarget(parent);
                      setInviteEmail(parent.email || '');
                    }}
                    className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Link2 className="w-3 h-3" /> 포털 초대
                  </button>
                  {status === 'invited' && (
                    <button
                      onClick={() => handleRevoke(parent)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg"
                    >
                      취소
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase">자녀 ({parentStudents.length}명)</p>
                {parentStudents.map((st) => {
                  const relLabel = getChildRelationship(parent.id, st!.id);
                  return (
                    <button
                      key={st!.id}
                      onClick={() => handleStudentClick(st!.id)}
                      className="w-full p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        {st!.name}
                        {relLabel && (
                          <span className="text-[10px] font-bold text-slate-400">({relLabel})</span>
                        )}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${getLevelColor(st!.level)}`}>
                        {st!.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredParents.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold">등록된 학부모가 없습니다</p>
        </div>
      )}

      {inviteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">학부모 포털 초대</h3>
              <button onClick={() => setInviteTarget(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-3">{inviteTarget.name} — 같은 이메일로 가입하면 자동 연결됩니다.</p>
            <label className="text-xs font-semibold text-slate-700">이메일</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="parent@email.com"
              className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-xl mb-4"
            />
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              초대 보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
