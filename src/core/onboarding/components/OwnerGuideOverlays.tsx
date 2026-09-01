import { useEffect, useState } from 'react';
import { usePermissions } from '@/core/auth/usePermissions';
import { StorageService } from '@/services/storage';
import { OnboardingWizard } from '@/shared/components';
import { shouldShowOwnerGuideWizard } from '../ownerGuideProgress';
import { OwnerGuideWizard } from './OwnerGuideWizard';

interface OwnerGuideOverlaysProps {
  /** 피아노학원 초기 설정 마법사 포함 여부 */
  includeSetupWizard?: boolean;
}

/** 사업주 온보딩·시작 가이드 오버레이 */
export function OwnerGuideOverlays({ includeSetupWizard = false }: OwnerGuideOverlaysProps) {
  const { isAdmin, settings } = usePermissions();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showGuideWizard, setShowGuideWizard] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setShowSetupWizard(false);
      setShowGuideWizard(false);
      return;
    }

    if (includeSetupWizard && StorageService.shouldShowOnboarding()) {
      setShowSetupWizard(true);
      setShowGuideWizard(false);
      return;
    }

    setShowSetupWizard(false);
    setShowGuideWizard(shouldShowOwnerGuideWizard(settings));
  }, [isAdmin, includeSetupWizard, settings]);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    const nextSettings = StorageService.getSettings();
    if (shouldShowOwnerGuideWizard(nextSettings)) {
      setShowGuideWizard(true);
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      {includeSetupWizard && showSetupWizard && (
        <OnboardingWizard onComplete={handleSetupComplete} />
      )}
      {showGuideWizard && (
        <OwnerGuideWizard onComplete={() => setShowGuideWizard(false)} />
      )}
    </>
  );
}
