import { useEffect, useState } from 'react';
import { StorageService } from '@/services/storage';

/** StorageService 변경 시 화면을 갱신하기 위한 공통 hook */
export function useStorageRefresh(): number {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    return StorageService.subscribe(() => setRefreshKey((k) => k + 1));
  }, []);

  return refreshKey;
}
