import { Bell, BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@harmonie/ui';
import { usePushNotifications } from '@/shared/notifications/PushNotificationContext';

export const NotificationsSection = () => {
  const { t } = useTranslation();
  const { disable, enable, status } = usePushNotifications();
  const isLoading = status === 'syncing';
  const isEnabled = status === 'enabled';
  const canEnable = status === 'disabled' || status === 'prompt' || status === 'error';
  const canDisable = status === 'enabled';
  const actionLabel = isEnabled ? t('notifications.push.disable') : t('notifications.push.enable');
  const descriptionKey =
    status === 'unsupported'
      ? 'unsupported'
      : status === 'denied'
        ? 'denied'
        : status === 'enabled'
          ? 'enabledDescription'
          : status === 'error'
            ? 'error'
            : 'disabledDescription';

  const handleToggle = () => {
    if (isEnabled) {
      void disable();
      return;
    }

    void enable().catch(() => {});
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-lg border border-secondary bg-surface-2 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-2">
          {isEnabled ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-1">{t('notifications.push.title')}</p>
          <p className="mt-1 text-sm leading-relaxed text-text-2">
            {t(`notifications.push.${descriptionKey}`)}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant={isEnabled ? 'secondary' : 'primary'}
          onClick={handleToggle}
          disabled={!(canEnable || canDisable)}
          isLoading={isLoading}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};
