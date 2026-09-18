import React, { useCallback, useEffect, useState } from 'react';
import { Home, X, ChevronDown, ChevronUp } from 'lucide-react';
import { isWebApp } from '@/core/platform';
import { appBrand } from '@/core/brand';
import {
  detectWebInstallPlatform,
  isStandaloneDisplay,
} from './pwa/detectWebInstallPlatform';
import { PWA_INSTALL_COPY } from './pwa/pwaInstallCopy';
import { PwaInstallGuide } from './pwa/PwaInstallGuide';

const STORAGE_DISMISS_UNTIL = 'moa.pwa.dismissUntil';
const STORAGE_INSTALLED = 'moa.pwa.installed';
/** beforeinstallprompt / iOS 진입 후 안내까지 대기 (ms) */
const PROMPT_DELAY_MS = 8_000;
/** 「나중에」 선택 시 재표시 억제 기간 */
const DISMISS_DAYS = 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

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
 * PWA 「홈 화면에 추가」 바텀시트.
 * Android(Chrome): beforeinstallprompt → 설치 CTA + 가이드
 * iPhone(Safari): 공유→홈 화면 추가 단계 가이드
 */
export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  const platform = detectWebInstallPlatform();
  const canNativeInstall = Boolean(deferredPrompt);

  const canOffer = useCallback(() => {
    return isWebApp() && !isStandaloneDisplay() && !isDismissed();
  }, []);

  useEffect(() => {
    if (!isWebApp() || isStandaloneDisplay()) return;

    const onInstalled = () => {
      markInstalled();
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleShow = () => {
      if (delayTimer) clearTimeout(delayTimer);
      delayTimer = setTimeout(() => {
        if (canOffer()) {
          setShowPrompt(true);
          // iOS는 설치 API가 없어 가이드를 기본 펼침
          if (detectWebInstallPlatform() === 'ios-safari') {
            setGuideOpen(true);
          }
        }
      }, PROMPT_DELAY_MS);
    };

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (!canOffer()) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      scheduleShow();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Safari 등 BIP 미지원: 지연 후 가이드 시트만 표시
    if (detectWebInstallPlatform() === 'ios-safari' && canOffer()) {
      scheduleShow();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [canOffer]);

  if (!isWebApp() || !showPrompt) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setGuideOpen(true);
      return;
    }
    setInstalling(true);
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
    } finally {
      setInstalling(false);
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleLater = () => {
    markDismissed();
    setShowPrompt(false);
  };

  const handleGotIt = () => {
    markDismissed();
    setShowPrompt(false);
  };

  const shortName = appBrand.shortName;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleLater}
      role="presentation"
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        <div className="px-5 pt-3 pb-2 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" aria-hidden />
        </div>

        <div className="px-5 pb-4 pt-1 flex items-start gap-3 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Home className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="pwa-install-title" className="text-base font-bold text-slate-900">
              {PWA_INSTALL_COPY.title(shortName)}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              {PWA_INSTALL_COPY.body(shortName)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLater}
            className="text-slate-400 hover:text-slate-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 rounded-xl hover:bg-slate-50"
            aria-label={PWA_INSTALL_COPY.laterCta}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-3">
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
            aria-expanded={guideOpen}
          >
            <span>
              {guideOpen ? PWA_INSTALL_COPY.guideHide : PWA_INSTALL_COPY.guideToggle}
              {platform === 'ios-safari'
                ? ` · ${PWA_INSTALL_COPY.iosTitle}`
                : platform === 'android-chrome'
                  ? ` · ${PWA_INSTALL_COPY.androidTitle}`
                  : ''}
            </span>
            {guideOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {guideOpen && <PwaInstallGuide platform={platform} />}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end safe-area-pb">
          <button
            type="button"
            onClick={handleLater}
            className="w-full sm:w-auto px-4 py-3 min-h-[44px] text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            {PWA_INSTALL_COPY.laterCta}
          </button>
          {canNativeInstall ? (
            <button
              type="button"
              disabled={installing}
              onClick={() => void handleInstall()}
              className="w-full sm:w-auto px-5 py-3 min-h-[44px] text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl"
            >
              {PWA_INSTALL_COPY.installCta}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGotIt}
              className="w-full sm:w-auto px-5 py-3 min-h-[44px] text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              {PWA_INSTALL_COPY.gotItCta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
