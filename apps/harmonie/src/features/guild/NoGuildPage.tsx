import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Button, LanguageSelector } from '@harmonie/ui';
import { Input } from '@harmonie/ui';
import { createGuild } from '@/api/guilds';
import { useUser } from '@/features/user/UserContext';
import { useGuilds } from './GuildContext';
import { LANGUAGES } from '@/i18n/languages.ts';

export const NoGuildPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { refresh } = useGuilds();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const displayName = user?.displayName ?? user?.username ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    setIsLoading(true);
    setError(false);
    try {
      const guild = await createGuild(trimmed);
      refresh();
      navigate(`/guilds/${guild.guildId}`);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center h-full bg-background">
      <div className="absolute right-3 top-3">
        <LanguageSelector
          languages={LANGUAGES}
          currentLang={i18n.language}
          onChange={i18n.changeLanguage}
        />
      </div>
      <div className="flex flex-col items-center gap-8 w-full max-w-sm px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
            <Users size={28} className="text-primary" />
          </div>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <Input
            label={t('guild.noGuild.nameLabel')}
            placeholder={t('guild.noGuild.namePlaceholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(false);
            }}
            error={error ? t('guild.noGuild.error') : undefined}
            disabled={isLoading}
            autoFocus
          />
          <Button type="submit" isLoading={isLoading} disabled={name.trim().length < 3}>
            {t('guild.noGuild.createButton')}
          </Button>
        </form>
      </div>
    </div>
  );
};
