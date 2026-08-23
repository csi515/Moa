import React, { createContext, useContext } from 'react';
import { skincareModuleLabels, type ModuleLabels } from './labels';

const ModuleLabelsContext = createContext<ModuleLabels>(skincareModuleLabels);

export const ModuleLabelsProvider: React.FC<{
  children: React.ReactNode;
  labels?: ModuleLabels;
}> = ({ children, labels = skincareModuleLabels }) => (
  <ModuleLabelsContext.Provider value={labels}>{children}</ModuleLabelsContext.Provider>
);

export function useModuleLabels(): ModuleLabels {
  return useContext(ModuleLabelsContext);
}
