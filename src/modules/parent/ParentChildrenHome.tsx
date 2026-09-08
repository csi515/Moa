import React, { useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { useParentPortal } from '@/core/parent/context/ParentPortalContext';
import { type GlobalStudent } from '@/core/parent/types/globalParent';
import { ParentRequestEnrollmentModal } from './ParentRequestEnrollmentModal';
import { ParentChildSelectorModal } from './ParentChildSelectorModal';
import { ParentEnrollmentConsentModal } from './ParentEnrollmentConsentModal';
import {
  requestEnrollment,
  cancelEnrollmentRequest,
  findOrganizationByCode,
  type OrganizationSearchResult,
} from '@/core/parent/services/enrollmentRequestService';
import {
  consumePendingOrgPublicCode,
  peekPendingOrgPublicCode,
} from '@/core/parent/services/pendingOrgConnect';
import { useApp } from '@/context/AppContext';
import { ParentAddChildModal } from './ParentAddChildModal';
import { ParentChildCard } from './ParentChildCard';
import { ParentEnrollmentStatusCard } from './ParentEnrollmentStatusCard';

export const ParentChildrenHome: React.FC<{ addRequest?: number }> = ({ addRequest = 0 }) => {
  const { portalTree, selectStudent, refreshPortalTree } = useParentPortal();
  const { showToast } = useApp();
  const children = portalTree?.children ?? [];
  const requests = portalTree?.enrollmentRequests ?? [];

  const [showOrgSearch, setShowOrgSearch] = useState(false);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationSearchResult | null>(null);
  const [selectedChild, setSelectedChild] = useState<GlobalStudent | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<GlobalStudent | null>(null);
  const [continueAfterAdd, setContinueAfterAdd] = useState(false);

  useEffect(() => {
    const code = peekPendingOrgPublicCode();
    if (!code) return;

    let cancelled = false;
    void (async () => {
      try {
        const org = await findOrganizationByCode(code);
        if (cancelled) return;
        if (!org) {
          consumePendingOrgPublicCode();
          showToast('?숈썝 肄붾뱶瑜?李얠쓣 ???놁뒿?덈떎. ?ㅼ떆 寃?됲빐 二쇱꽭??', 'error');
          return;
        }
        consumePendingOrgPublicCode();
        setSelectedOrg(org);
        setShowChildSelector(true);
        showToast(`${org.name} ?숈썝 ?곌껐???댁뼱??吏꾪뻾?⑸땲??, 'info');
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : '?숈썝 議고쉶???ㅽ뙣?덉뒿?덈떎', 'error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    if (addRequest < 1) return;
    setEditingChild(null);
    setContinueAfterAdd(Boolean(selectedOrg));
    setShowAddChild(true);
  }, [addRequest]);

  const handleOrgSelect = (org: OrganizationSearchResult) => {
    setSelectedOrg(org);
    setShowOrgSearch(false);
    setShowChildSelector(true);
  };

  const handleChildSelect = (child: GlobalStudent) => {
    setSelectedChild(child);
    setShowChildSelector(false);
    setShowConsent(true);
  };

  const parentPhone = portalTree?.parent?.phone?.trim() ?? '';

  const focusPhone = () => {
    showToast('학원에서 부를 연락처를 아래 계정에 먼저 저장해 주세요.', 'error');
    document.getElementById('parent-phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const startEnrollmentRequest = () => {
    if (!parentPhone) {
      focusPhone();
      return;
    }
    setShowOrgSearch(true);
  };

  const handleConfirmRequest = async (consentFields: string[], notes?: string) => {
    if (!selectedOrg || !selectedChild) return;
    if (!parentPhone) {
      setShowConsent(false);
      focusPhone();
      return;
    }

    try {
      const result = await requestEnrollment({
        studentId: selectedChild.studentId,
        organizationId: selectedOrg.id,
        consentFields,
        notes,
      });

      showToast(`${result.organizationName}??${result.studentName} ?곌껐???붿껌?덉뒿?덈떎`, 'success');
      setShowConsent(false);
      setSelectedOrg(null);
      setSelectedChild(null);
      await refreshPortalTree();
    } catch (err) {
      throw err;
    }
  };

  const handleChildSaved = async (
    message: string,
    created?: {
      studentId: string;
      displayName: string;
      birthDate: string | null;
      gender: string | null;
      school: string | null;
      grade: string | null;
      relationship: GlobalStudent['relationship'];
    }
  ) => {
    showToast(message, 'success');
    await refreshPortalTree();
    if (continueAfterAdd && selectedOrg && created?.studentId) {
      setSelectedChild({
        studentId: created.studentId,
        displayName: created.displayName,
        birthDate: created.birthDate,
        gender: created.gender,
        school: created.school,
        grade: created.grade,
        relationship: created.relationship,
        isPrimary: true,
        enrollments: [],
      });
      setShowChildSelector(false);
      setShowConsent(true);
    }
    setContinueAfterAdd(false);
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelEnrollmentRequest(requestId);
      showToast('?숈썝 ?곌껐 ?붿껌??痍⑥냼?덉뒿?덈떎', 'success');
      await refreshPortalTree();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '?붿껌 痍⑥냼???ㅽ뙣?덉뒿?덈떎', 'error');
    }
  };

  const openAddChild = () => {
    setEditingChild(null);
    setContinueAfterAdd(Boolean(selectedOrg));
    setShowChildSelector(false);
    setShowAddChild(true);
  };

  return (
    <>
      {children.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">?곌껐???먮?媛 ?놁뒿?덈떎</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            ?꾩そ??8?먮━ ?먮? ?곌껐 肄붾뱶濡?諛붾줈 ?곌껐?섍굅??
            <br />
            ???먮?瑜??깅줉?????숈썝 怨듦컻肄붾뱶濡??붿껌?????덉뒿?덈떎
          </p>
          {selectedOrg && (
            <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4">
              {selectedOrg.name} ?곌껐???댁뼱媛?ㅻ㈃ 癒쇱? ?먮?瑜??깅줉??二쇱꽭??
            </p>
          )}
          <button
            type="button"
            onClick={openAddChild}
            className="w-full py-2.5 mb-2 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px]"
          >
            ???먮? ?깅줉
          </button>
          <button
            type="button"
            onClick={startEnrollmentRequest}
            className="w-full py-2.5 mb-4 border border-indigo-200 text-indigo-700 text-sm font-bold rounded-xl min-h-[44px]"
          >
            ?숈썝 ?곌껐 ?붿껌
          </button>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-left">
            <p className="text-xs font-bold text-indigo-900 mb-2">?숈썝 ?곌껐 諛⑸쾿</p>
            <ul className="text-xs text-indigo-700 space-y-1">
              <li>???숈썝??以 8?먮━ 肄붾뱶?????낅젰移몄뿉留??ｌ쑝?몄슂</li>
              <li>??QR???덉쑝硫??꾩쓽 QR濡??ㅼ틪?????덉뒿?덈떎</li>
              <li>???숈썝 ?대쫫쨌怨듦컻肄붾뱶???숈썝 ?곌껐 ?붿껌?먯꽌 寃?됲븯?몄슂</li>
            </ul>
          </div>
        </div>
      ) : (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">???먮?</p>
          <button
            type="button"
            onClick={startEnrollmentRequest}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            ?숈썝 ?곌껐 ?붿껌
          </button>
        </div>

        <div className="space-y-3">
          {children.map((child) => (
            <ParentChildCard
              key={child.studentId}
              child={child}
              onSelect={() => {
                if (child.enrollments.length > 0) {
                  selectStudent(child);
                  return;
                }
                if (selectedOrg) {
                  handleChildSelect(child);
                  return;
                }
                startEnrollmentRequest();
              }}
              onEdit={() => {
                setEditingChild(child);
                setContinueAfterAdd(false);
                setShowAddChild(true);
              }}
            />
          ))}
        </div>

      </div>
      )}

      {requests.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">?숈썝 ?곌껐 ?붿껌 ?꾪솴</p>
          <div className="space-y-2">
            {requests.map((request) => (
                <ParentEnrollmentStatusCard
                key={request.id}
                request={request}
                onCancel={() => void handleCancelRequest(request.id)}
              />
            ))}
          </div>
        </div>
      )}

      <ParentRequestEnrollmentModal
        isOpen={showOrgSearch}
        onClose={() => setShowOrgSearch(false)}
        onSelectOrg={handleOrgSelect}
      />

      <ParentChildSelectorModal
        isOpen={showChildSelector}
        onClose={() => setShowChildSelector(false)}
        children={children}
        onSelect={handleChildSelect}
        onRegisterChild={openAddChild}
        title="?곌껐???먮? ?좏깮"
      />

      <ParentAddChildModal
        isOpen={showAddChild}
        child={editingChild}
        onClose={() => {
          setShowAddChild(false);
          setEditingChild(null);
        }}
        onSuccess={(message, created) => void handleChildSaved(message, created)}
      />

      {selectedOrg && selectedChild && (
        <ParentEnrollmentConsentModal
          isOpen={showConsent}
          onClose={() => {
            setShowConsent(false);
            setSelectedOrg(null);
            setSelectedChild(null);
          }}
          organization={selectedOrg}
          student={selectedChild}
          onConfirm={handleConfirmRequest}
        />
      )}
    </>
  );
};
