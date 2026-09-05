import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, X } from 'lucide-react';
import { isWebApp } from '@/core/platform';
import { appBrand } from '@/core/brand';

const STORAGE_DISMISS_UNTIL = 'moa.pwa.dismissUntil';
const STORAGE_INSTALLED = 'moa.pwa.installed';
/** beforeinstallprompt 후 안내까지 대기 (ms) */
const PROMPT_DELAY_MS = 60_000;
/** 「나중에」 선택 시 재표시 억제 기간 */
const DISMISS_DAYS = 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return true;
  const media = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

function isDismissed(): boolean {
  try {
    if (localStorage.getItem(STORAGE_INSTALLED) === '1') return true;
    const until = localStorage.getItem(STORAGE_DISMISS_UNTIL);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_DISMISS_UNTIL, String(until));
  } catch {
    /* ignore */
  }
}

function markInstalled(): void {
  try {
    localStorage.setItem(STORAGE_INSTALLED, '1');
    localStorage.removeItem(STORAGE_DISMISS_UNTIL);
  } catch {
    /* ignore */
  }
}

/**
 * PWA 설치 안내 — Header 단일 마운트.
 * 상시 「앱 설치」 버튼 없음. beforeinstallprompt + 지연 + dismiss persist.
 */
export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const canOffer = useCallback(() => {
    return isWebApp() && !isStandaloneDisplay() && !isDismissed();
  }, []);

  useEffect(() => {
    if (!isWebApp()) return;
    if (isStandaloneDisplay()) return;

    const onInstalled = () => {
      markInstalled();
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (!canOffer()) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      delayTimer = setTimeout(() => {
        if (canOffer()) setShowPrompt(true);
      }, PROMPT_DELAY_MS);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [canOffer]);

  if (!isWebApp() || !showPrompt || !deferredPrompt) return null;

  const handleInstall = async () => {
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        markInstalled();
      } else {
        markDismissed();
      }
    } catch {
      markDismissed();
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleLater = () => {
    markDismissed();
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:right-auto z-40 max-w-sm bg-indigo-900 text-white p-4 rounded-2xl shadow-xl border border-indigo-700 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold">{appBrand.shortName}를 홈 화면에 추가</h4>
          <p className="text-xs text-indigo-200 mt-0.5 leading-snug">
            더 빠르게 열고 사용할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLater}
          className="text-indigo-300 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          aria-label="나중에"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={handleLater}
          className="px-3 py-2 min-h-[44px] text-xs font-bold text-indigo-200 hover:text-white rounded-lg"
        >
          나중에
        </button>
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="px-4 py-2 min-h-[44px] bg-white text-indigo-900 text-xs font-bold rounded-lg hover:bg-indigo-50"
        >
          설치하기
        </button>
      </div>
    </div>
  );
};
