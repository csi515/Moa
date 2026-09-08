import { useEffect, useMemo, type FC } from 'react';
import { Users } from 'lucide-react';
import { useApp, type NavTab } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { getCustomerListTab } from '@/core/industry/industryUi';
import { PageHeader, SegmentedControl } from '@/shared/components';
import { StudentListView } from '../students/StudentListView';
import { ParentManagementView } from '../parents/ParentManagementView';
import { GuardianEnrollmentRequestsView } from '../enrollments/GuardianEnrollmentRequestsView';
import { CustomerJoinRequestsPanel } from '@/core/customer/CustomerJoinRequestsPanel';
import {
  consumeOpenGuardianEnrollments,
  consumeOpenMembershipJoins,
} from '@/core/customer/studentJoinInbox';

type CustomerSegment = 'list' | 'parents' | 'enrollment';

/** 고객 업무 영역 허브 — 목록·보호자·등록 요청 */
export const CustomerHubView: FC<{
  listView?: FC;
  enrollmentLabel?: string;
}> = ({ listView, enrollmentLabel = '등록 요청' }) => {
  const { activeTab, setActiveTab } = useApp();
  const { industry } = usePermissions();
  const listTab = getCustomerListTab(industry) as NavTab;
  const ListView = listView ?? StudentListView;

  const segment: CustomerSegment = useMemo(() => {
    if (activeTab === 'parents') return 'parents';
    if (activeTab === 'enrollment-requests') return 'enrollment';
    return 'list';
  }, [activeTab]);

  const options = useMemo(
    () => [
      { value: 'list' as const, label: '목록' },
      { value: 'parents' as const, label: '보호자' },
      { value: 'enrollment' as const, label: enrollmentLabel },
    ],
    [enrollmentLabel]
  );

  const description =
    segment === 'list'
      ? '등록된 고객을 관리합니다.'
      : segment === 'parents'
        ? '보호자(학부모) 계정을 관리합니다.'
        : '수강 가입과 학부모 자녀 등록 요청을 검토합니다.';

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<Users className="w-5 h-5" />}
        title="고객"
        description={description}
        actions={
          <SegmentedControl
            value={segment}
            options={options}
            onChange={(next) => {
              if (next === 'list') setActiveTab(listTab);
              else if (next === 'parents') setActiveTab('parents');
              else setActiveTab('enrollment-requests');
            }}
            aria-label="고객 메뉴"
            fullWidth
            className="w-full sm:w-auto min-w-[240px]"
          />
        }
      />

      {segment === 'list' && <ListView />}
      {segment === 'parents' && <ParentManagementView />}
      {segment === 'enrollment' && <EnrollmentInbox />}
    </div>
  );
};

function EnrollmentInbox() {
  useEffect(() => {
    const openGuardian = consumeOpenGuardianEnrollments();
    const openMembership = consumeOpenMembershipJoins();
    const targetId = openGuardian
      ? 'guardian-enrollment-inbox'
      : openMembership
        ? 'membership-join-inbox'
        : null;
    if (!targetId) return;
    document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <div className="space-y-8">
      <div id="membership-join-inbox">
        <CustomerJoinRequestsPanel
          embedded
          requestType="membership"
          title="수강 가입"
          description="성인 수강생이 보낸 가입 신청입니다. 승인하면 그 계정으로 이 학원을 이용할 수 있습니다."
        />
      </div>
      <GuardianEnrollmentRequestsView />
    </div>
  );
};
