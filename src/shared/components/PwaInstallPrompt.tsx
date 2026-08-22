import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('브라우저 메뉴에서 [홈 화면에 추가] 또는 [앱 설치]를 선택해주세요.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        title="홈 화면에 PWA 앱 설치"
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>앱 설치</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-40 max-w-sm bg-indigo-900 text-white p-4 rounded-2xl shadow-xl border border-indigo-700 flex items-center justify-between gap-3 animate-bounce-short">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold">피아노학원 앱 설치</h4>
          <p className="text-xs text-indigo-200 mt-0.5">홈 화면에 추가하여 앱처럼 빠르게 사용하세요</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-white text-indigo-900 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors shrink-0"
        >
          설치
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-indigo-300 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
