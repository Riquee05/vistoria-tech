export interface PwaInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    vtDeferredInstallPrompt: PwaInstallPromptEvent | null;
  }
}

export const PWA_INSTALL_PROMPT_CHANGED = 'vt-pwa-install-prompt-changed';

export function registerPwaInstallPrompt() {
  window.vtDeferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    window.vtDeferredInstallPrompt = event as PwaInstallPromptEvent;
    window.dispatchEvent(new Event(PWA_INSTALL_PROMPT_CHANGED));
  });

  window.addEventListener('appinstalled', () => {
    window.vtDeferredInstallPrompt = null;
    window.dispatchEvent(new Event(PWA_INSTALL_PROMPT_CHANGED));
  });
}
