import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { IconButton } from '@harmonie/ui';

type TauriWindow = Window &
  typeof globalThis & {
    __TAURI_INTERNALS__?: unknown;
  };

const isTauriRuntime = () =>
  typeof window !== 'undefined' && Boolean((window as TauriWindow).__TAURI_INTERNALS__);

export const AppUpdateButton = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'checking' | 'installing'>('idle');

  if (!isTauriRuntime()) {
    return null;
  }

  const title =
    status === 'checking'
      ? t('desktop.update.checking')
      : status === 'installing'
        ? t('desktop.update.installing')
        : t('desktop.update.action');

  const handleUpdateClick = async () => {
    setStatus('checking');

    try {
      const update = await check();

      if (!update) {
        window.alert(t('desktop.update.none'));
        setStatus('idle');
        return;
      }

      setStatus('installing');
      await update.downloadAndInstall();
      await relaunch();
    } catch {
      window.alert(t('desktop.update.error'));
      setStatus('idle');
    }
  };

  return (
    <IconButton
      size="small"
      onClick={handleUpdateClick}
      disabled={status !== 'idle'}
      aria-label={title}
      title={title}
    >
      <RefreshCw size={16} className={status === 'idle' ? undefined : 'animate-spin'} />
    </IconButton>
  );
};
