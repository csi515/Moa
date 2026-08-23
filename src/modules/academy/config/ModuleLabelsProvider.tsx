import React, { type ReactNode } from 'react';
import {
  ModuleLabelsProvider as PianoModuleLabelsProvider,
  type ModuleLabels,
} from '@/modules/piano';
import { academyModuleLabels } from './labels';

/**
 * Piano 공유 뷰가 useModuleLabels(@/modules/piano)를 쓰므로
 * 동일 Context에 일반 학원 라벨을 주입한다.
 */
export const ModuleLabelsProvider: React.FC<{
  children: ReactNode;
  labels?: ModuleLabels;
}> = ({ children, labels = academyModuleLabels }) => (
  <PianoModuleLabelsProvider labels={labels}>{children}</PianoModuleLabelsProvider>
);

export { useModuleLabels } from '@/modules/piano';
