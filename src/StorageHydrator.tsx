import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const runHydrate = useCallback(async (cancelled: () => boolean) => {
    setReady(false);
    setError(null);

    try {
      await StorageService.hydrate(organizationId, normalizeIndustryType(industryType));
      if (!cancelled()) setReady(true);
    } catch (err) {
      if (!cancelled()) {
        const message =
          err instanceof Error ? err.message : '데이터를 불러오지 못했습니다. 네트워크를 확인해 주세요.';
        setError(message);
      }
    }
  }, [organizationId, industryType]);

  useEffect(() => {
    let cancelled = false;

    void runHydrate(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [runHydrate, attempt]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 px-6 text-center">
        <p className="text-sm text-rose-600 max-w-sm">{error}</p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl min-h-[44px] hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    );
  }

  if (!ready) {
    return <LoadingScreen message="데이터를 불러오는 중..." />;
  }

  return <>{children}</>;
};
