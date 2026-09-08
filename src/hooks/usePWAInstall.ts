import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((listener) => listener());
  });
}

export function usePWAInstall() {
  const [promptAvailable, setPromptAvailable] = useState<boolean>(Boolean(globalDeferredPrompt));
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('pwa_prompt_dismissed') === 'true';
  });

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  const isAndroid =
    typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

  useEffect(() => {
    const update = () => {
      setPromptAvailable(Boolean(globalDeferredPrompt));
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!globalDeferredPrompt) return false;

    try {
      await globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        setPromptAvailable(false);
        return true;
      }
    } catch (err) {
      console.error('Error during PWA install prompt:', err);
    }
    return false;
  };

  const dismissPrompt = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return {
    isInstallable: promptAvailable && !isStandalone && !isDismissed,
    canPromptDirectly: promptAvailable,
    promptInstall,
    dismissPrompt,
    isStandalone,
    isIOS,
    isAndroid,
  };
}
