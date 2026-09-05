import { useMemo, type FC } from 'react';
import { Ticket, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, SegmentedControl } from '@/shared/components';

type CustomerSegment = 'members' | 'passes';

/** 필라테스 고객 허브 — 회원·이용권 */
export const PilatesCustomerHubView: FC<{
  membersView: FC;
  passesView: FC;
}> = ({ membersView: MembersView, passesView: PassesView }) => {
  const { activeTab, setActiveTab } = useApp();
  const segment: CustomerSegment = useMemo(
    () => (activeTab === 'passes' ? 'passes' : 'members'),
    [activeTab]
  );

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={segment === 'members' ? <Users className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
        title="고객"
        description={segment === 'members' ? '회원 관리' : '이용권 관리'}
        actions={
          <SegmentedControl
            value={segment}
            options={[
              { value: 'members', label: '회원' },
              { value: 'passes', label: '이용권' },
            ]}
            onChange={(next) => setActiveTab(next)}
            aria-label="고객 메뉴"
            fullWidth
            className="w-full sm:w-auto min-w-[180px]"
          />
        }
      />
      {segment === 'members' ? <MembersView /> : <PassesView />}
    </div>
  );
};
