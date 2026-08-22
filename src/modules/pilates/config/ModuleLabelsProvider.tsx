import React, { createContext, useContext } from 'react';
import { pilatesModuleLabels, type ModuleLabels } from './labels';

const ModuleLabelsContext = createContext<ModuleLabels>(pilatesModuleLabels);

export const ModuleLabelsProvider: React.FC<{
  children: React.ReactNode;
  labels?: ModuleLabels;
}> = ({ children, labels = pilatesModuleLabels }) => (
  <ModuleLabelsContext.Provider value={labels}>{children}</ModuleLabelsContext.Provider>
);

export function useModuleLabels(): ModuleLabels {
  return useContext(ModuleLabelsContext);
}
