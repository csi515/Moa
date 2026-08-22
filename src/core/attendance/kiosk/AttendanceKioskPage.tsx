import React from 'react';
import { PinCheckInKioskView } from '../components/PinCheckInKioskView';
import { KioskLayout } from './KioskLayout';
import { resolveKioskSettings } from './kioskConfig';
import { useKioskWakeLock } from './hooks/useKioskWakeLock';
import { StorageService } from '@/services/storage';

/** PWA / Capacitor 공용 전체화면 출결 키오스크 (`/kiosk`) */
export const AttendanceKioskPage: React.FC = () => {
  const kioskSettings = resolveKioskSettings(StorageService.getSettings());

  useKioskWakeLock(kioskSettings.wakeLockEnabled);

  const handleExit = () => {
    window.location.href = '/';
  };

  return (
    <KioskLayout onExit={handleExit}>
      <PinCheckInKioskView mode="standalone" kioskSettings={kioskSettings} />
    </KioskLayout>
  );
};
