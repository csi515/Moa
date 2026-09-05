import { useMemo, type FC } from 'react';
import { BookOpen, Pill } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, SegmentedControl } from '@/shared/components';

type CareSegment = 'journals' | 'medications';

/** 어린이집 보육 허브 — 알림장·투약 */
export const DaycareCareHubView: FC<{
  journalsView: FC;
  medicationsView: FC;
}> = ({ journalsView: JournalsView, medicationsView: MedicationsView }) => {
  const { activeTab, setActiveTab } = useApp();
  const segment: CareSegment = useMemo(
    () => (activeTab === 'medications' ? 'medications' : 'journals'),
    [activeTab]
  );

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={segment === 'journals' ? <BookOpen className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
        title="보육"
        description={
          segment === 'journals' ? '알림장 작성·확인' : '투약 요청 관리'
        }
        actions={
          <SegmentedControl
            value={segment}
            options={[
              { value: 'journals', label: '알림장' },
              { value: 'medications', label: '투약' },
            ]}
            onChange={(next) => setActiveTab(next)}
            aria-label="보육 메뉴"
            fullWidth
            className="w-full sm:w-auto min-w-[180px]"
          />
        }
      />
      {segment === 'journals' ? <JournalsView /> : <MedicationsView />}
    </div>
  );
};
