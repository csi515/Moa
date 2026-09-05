import { useMemo, type FC } from 'react';
import { Users } from 'lucide-react';
import { useApp, type NavTab } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { getCustomerListTab } from '@/core/industry/industryUi';
import { PageHeader, SegmentedControl } from '@/shared/components';
import { StudentListView } from '../students/StudentListView';
import { ParentManagementView } from '../parents/ParentManagementView';
import { GuardianEnrollmentRequestsView } from '../enrollments/GuardianEnrollmentRequestsView';

type CustomerSegment = 'list' | 'parents' | 'enrollment';

/** 고객 업무 영역 허브 — 목록·보호자·등록 요청 */
export const CustomerHubView: FC<{
  listView?: FC;
  enrollmentLabel?: string;
}> = ({ listView: ListView = StudentListView, enrollmentLabel = '등록 요청' }) => {
  const { activeTab, setActiveTab } = useApp();
  const { industry } = usePermissions();
  const listTab = getCustomerListTab(industry) as NavTab;

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
        : '가입·등록 요청을 검토합니다.';

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
      {segment === 'enrollment' && <GuardianEnrollmentRequestsView />}
    </div>
  );
};
