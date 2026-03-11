import { useTranslation } from 'react-i18next';
import { RadioCard } from '@harmonie/ui';

export const ThemeSection = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t('settings.theme.label')}</p>
      <RadioCard name="theme" value="default" checked disabled>
        {t('settings.theme.default')}
      </RadioCard>
      <p className="text-xs text-text-4 italic">{t('settings.theme.comingSoon')}</p>
    </div>
  );
};
