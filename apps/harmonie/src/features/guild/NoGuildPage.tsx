import { Trans, useTranslation } from 'react-i18next';
import { LanguageSelector } from '@harmonie/ui';
import { useUser } from '@/features/user/UserContext';
import { LANGUAGES } from '@/i18n/languages.ts';
import { GuildForm } from './GuildForm';

export const NoGuildPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();

  const displayName = user?.displayName ?? user?.username ?? '';

  return (
    <div className="flex-1 h-full bg-background overflow-y-auto">
      <div className="absolute right-3 top-3">
        <LanguageSelector
          languages={LANGUAGES}
          currentLang={i18n.language}
          onChange={i18n.changeLanguage}
        />
      </div>
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-sm border border-border-2 bg-surface-1 p-6 md:p-8">
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="font-display italic text-2xl text-text-1">
                <Trans
                  i18nKey="guild.noGuild.title"
                  values={{ name: displayName }}
                  components={{
                    brand: <span className="text-primary font-display italic" />,
                  }}
                />
              </h1>
              <p className="font-body text-sm text-text-2">{t('guild.noGuild.subtitle')}</p>
            </div>
          </div>

          <GuildForm autoFocus />
        </div>
      </div>
    </div>
  );
};
