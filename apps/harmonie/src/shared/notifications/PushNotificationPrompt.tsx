import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton } from '@harmonie/ui';

interface PushNotificationPromptProps {
  isLoading: boolean;
  onEnable: () => Promise<void>;
  onDismiss: () => void;
}

export const PushNotificationPrompt = ({
  isLoading,
  onDismiss,
  onEnable,
}: PushNotificationPromptProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  const handleEnable = async () => {
    setError(false);
    await onEnable().catch(() => setError(true));
  };

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center sm:inset-x-auto sm:right-4 sm:bottom-4">
      <div className="pointer-events-auto flex w-full max-w-105 items-center gap-3 rounded-lg border border-secondary bg-surface-1 p-3 shadow-[0_8px_32px_rgba(61,53,48,0.18)]">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg">
          <Bell size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-1">{t('notifications.push.promptTitle')}</p>
          <p className="text-xs leading-snug text-text-2">
            {error ? t('notifications.push.error') : t('notifications.push.promptDescription')}
          </p>
        </div>

        <Button size="small" onClick={handleEnable} isLoading={isLoading} className="shrink-0">
          {t('notifications.push.enable')}
        </Button>

        <IconButton
          size="small"
          variant="ghost"
          onClick={onDismiss}
          title={t('notifications.push.dismiss')}
          className="shrink-0"
        >
          <X size={16} />
        </IconButton>
      </div>
    </div>
  );
};
