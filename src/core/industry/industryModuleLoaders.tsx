import { lazy } from 'react';

/** 업종 AppContent + labels를 같은 lazy 경계에서 로드한다. barrel은 쓰지 않는다. */

export const PianoIndustryApp = lazy(async () => {
  const [{ PianoAppContent }, { ModuleLabelsProvider }] = await Promise.all([
    import('@/modules/piano/PianoAppContent'),
    import('@/modules/piano/config/ModuleLabelsProvider'),
  ]);
  return {
    default: function PianoIndustryApp() {
      return (
        <ModuleLabelsProvider>
          <PianoAppContent />
        </ModuleLabelsProvider>
      );
    },
  };
});

export const PilatesIndustryApp = lazy(async () => {
  const [{ PilatesAppContent }, { ModuleLabelsProvider }] = await Promise.all([
    import('@/modules/pilates/PilatesAppContent'),
    import('@/modules/pilates/config/ModuleLabelsProvider'),
  ]);
  return {
    default: function PilatesIndustryApp() {
      return (
        <ModuleLabelsProvider>
          <PilatesAppContent />
        </ModuleLabelsProvider>
      );
    },
  };
});

export const GymIndustryApp = lazy(async () => {
  const [{ GymAppContent }, { ModuleLabelsProvider }] = await Promise.all([
    import('@/modules/gym/GymAppContent'),
    import('@/modules/gym/config/ModuleLabelsProvider'),
  ]);
  return {
    default: function GymIndustryApp() {
      return (
        <ModuleLabelsProvider>
          <GymAppContent />
        </ModuleLabelsProvider>
      );
    },
  };
});

export const DaycareIndustryApp = lazy(async () => {
  const [{ DaycareAppContent }, { ModuleLabelsProvider }] = await Promise.all([
    import('@/modules/daycare/DaycareAppContent'),
    import('@/modules/daycare/config/ModuleLabelsProvider'),
  ]);
  return {
    default: function DaycareIndustryApp() {
      return (
        <ModuleLabelsProvider>
          <DaycareAppContent />
        </ModuleLabelsProvider>
      );
    },
  };
});

export const SkinIndustryApp = lazy(async () => {
  const [{ SkinAppContent }, { ModuleLabelsProvider }] = await Promise.all([
    import('@/modules/skin/SkinAppContent'),
    import('@/modules/skin/config/ModuleLabelsProvider'),
  ]);
  return {
    default: function SkinIndustryApp() {
      return (
        <ModuleLabelsProvider>
          <SkinAppContent />
        </ModuleLabelsProvider>
      );
    },
  };
});

export const RetailIndustryApp = lazy(async () => {
  const [{ RetailAppContent }, { ModuleLabelsProvider }] = await Promise.all([
    import('@/modules/retail/RetailAppContent'),
    import('@/modules/retail/config/ModuleLabelsProvider'),
  ]);
  return {
    default: function RetailIndustryApp() {
      return (
        <ModuleLabelsProvider>
          <RetailAppContent />
        </ModuleLabelsProvider>
      );
    },
  };
});

export const BathIndustryApp = lazy(async () => {
  const [{ BathAppContent }, { ModuleLabelsProvider }] = await Promise.all([
    import('@/modules/bath/BathAppContent'),
    import('@/modules/bath/config/ModuleLabelsProvider'),
  ]);
  return {
    default: function BathIndustryApp() {
      return (
        <ModuleLabelsProvider>
          <BathAppContent />
        </ModuleLabelsProvider>
      );
    },
  };
});
