import '@/app/industry/loadIndustryModules';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { stashOAuthCallbackErrorFromLocation } from '@/core/auth/oauthCallbackError';
import { clearStaleChunkReloadFlag } from '@/shared/pwa/reloadOnStaleChunk';

stashOAuthCallbackErrorFromLocation();
clearStaleChunkReloadFlag();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
