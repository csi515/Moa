import React, { useEffect, useState } from 'react';
import { StorageService } from './services/storage';
import { normalizeIndustryType } from './core/industry/types';
import { LoadingScreen } from './shared/components/LoadingScreen';

interface StorageHydratorProps {
  organizationId: string;
  industryType?: string | null;
  children: React.ReactNode;
}

/** org 선택 시 StorageService hydrate */
export const StorageHydrator: React.FC<StorageHydratorProps> = ({
  organizationId,
  industryType,
  children,
}) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    void StorageService.hydrate(organizationId, normalizeIndustryType(industryType)).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [organizationId, industryType]);

  if (!ready) {
    return <LoadingScreen message="데이터를 불러오는 중..." />;
  }

  return <>{children}</>;
};
