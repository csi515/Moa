import React, { createContext, useContext, ReactNode } from 'react';
import { pianoModuleLabels, type ModuleLabels } from './labels';

const ModuleLabelsContext = createContext<ModuleLabels>(pianoModuleLabels);

export const ModuleLabelsProvider: React.FC<{ children: ReactNode; labels?: ModuleLabels }> = ({
  children,
  labels = pianoModuleLabels,
}) => (
  <ModuleLabelsContext.Provider value={labels}>{children}</ModuleLabelsContext.Provider>
);

/** Piano 모듈 UI 라벨 (Customer→원생, Staff→선생님 등) */
export function useModuleLabels(): ModuleLabels {
  return useContext(ModuleLabelsContext);
}
