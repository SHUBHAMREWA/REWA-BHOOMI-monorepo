'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// Module-level cache for beforeinstallprompt event
let globalDeferredPrompt: any = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem('pwa_installed', 'true');
    } catch {}
    notifyListeners();
  });
}

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);

  const checkState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    let installed = standalone;
    try {
      if (localStorage.getItem('pwa_installed') === 'true') {
        installed = true;
      }
    } catch {}

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    setIsStandalone(standalone);
    setIsInstalled(installed);
    setIsIos(ios);
    setHasPrompt(!!globalDeferredPrompt);
    setMounted(true);
  }, []);

  useEffect(() => {
    checkState();
    listeners.add(checkState);
    return () => {
      listeners.delete(checkState);
    };
  }, [checkState]);

  const promptInstall = async () => {
    if (globalDeferredPrompt) {
      globalDeferredPrompt.prompt();
      try {
        const { outcome } = await globalDeferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('pwa_installed', 'true');
          setIsInstalled(true);
          toast.success('Rewa Bhoomi App installed! 🎉');
        }
      } catch {}
      globalDeferredPrompt = null;
      notifyListeners();
      return;
    }

    if (isIos) {
      toast('Tap Share ⎋ and select "Add to Home Screen" ➕', {
        icon: '📱',
        duration: 5000,
      });
      return;
    }

    // Fallback guidance for other browsers
    toast('To install, tap your browser menu (⋮) and select "Install app" or "Add to Home screen"', {
      icon: '📲',
      duration: 5000,
    });
  };

  // Only show Get App button if mounted and user is NOT running standalone app and NOT recorded as installed
  const canInstall = mounted && !isStandalone && !isInstalled;

  return {
    isStandalone,
    isInstalled,
    canInstall,
    promptInstall,
    hasPrompt,
    isIos,
  };
}
