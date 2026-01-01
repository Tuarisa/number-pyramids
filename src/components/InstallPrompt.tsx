/**
 * InstallPrompt Component
 *
 * Shows a non-intrusive prompt for PWA installation
 * when the browser supports it (beforeinstallprompt event).
 */

import React, { useEffect, useState } from 'react';

// Define the BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwaInstallDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay to not interrupt initial experience
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };

  if (!showPrompt || dismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-pop">
      <div className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-primary-200">
        <div className="flex items-start gap-3">
          <div className="text-3xl">📲</div>
          <div className="flex-1">
            <h3 className="font-bold text-primary-800 mb-1">
              Установить приложение?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Добавь на главный экран для быстрого доступа и игры без интернета!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="
                  flex-1 py-2 px-4
                  rounded-lg
                  bg-primary-500 text-white font-medium
                  hover:bg-primary-600
                  transition-colors
                "
              >
                Установить
              </button>
              <button
                onClick={handleDismiss}
                className="
                  py-2 px-4
                  rounded-lg
                  text-gray-500 font-medium
                  hover:bg-gray-100
                  transition-colors
                "
              >
                Потом
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
