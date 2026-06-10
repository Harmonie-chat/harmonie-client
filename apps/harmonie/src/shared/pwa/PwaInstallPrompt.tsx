import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton } from '@harmonie/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const dismissedStorageKey = 'harmonie-pwa-install-dismissed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const isIos = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
};

export const PwaInstallPrompt = () => {
  const { t } = useTranslation();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(dismissedStorageKey) === 'true'
  );
  const [showIosPrompt, setShowIosPrompt] = useState(
    () => !isDismissed && !isStandalone() && isIos()
  );

  useEffect(() => {
    if (isDismissed || isStandalone()) return;

    if (isIos()) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isDismissed]);

  const dismiss = () => {
    localStorage.setItem(dismissedStorageKey, 'true');
    setIsDismissed(true);
    setInstallPrompt(null);
    setShowIosPrompt(false);
  };

  const install = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') dismiss();
    setInstallPrompt(null);
  };

  if (isDismissed || (!installPrompt && !showIosPrompt)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center sm:inset-x-auto sm:right-4 sm:bottom-4">
      <div className="pointer-events-auto flex w-full max-w-100 items-center gap-3 rounded-lg border border-secondary bg-surface-1 p-3 shadow-[0_8px_32px_rgba(61,53,48,0.18)]">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg">
          {showIosPrompt ? <Share size={18} /> : <Download size={18} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-1">{t('pwa.install.title')}</p>
          <p className="text-xs leading-snug text-text-2">
            {showIosPrompt ? t('pwa.install.iosDescription') : t('pwa.install.description')}
          </p>
        </div>

        {installPrompt && (
          <Button size="small" onClick={install} className="shrink-0">
            {t('pwa.install.action')}
          </Button>
        )}

        <IconButton
          size="small"
          variant="ghost"
          onClick={dismiss}
          title={t('pwa.install.dismiss')}
          className="shrink-0"
        >
          <X size={16} />
        </IconButton>
      </div>
    </div>
  );
};
