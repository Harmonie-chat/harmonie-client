import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Avatar, Button, ColorSwatches, IconButton, Input, LanguageSelector } from '@harmonie/ui';
import { createGuild } from '@/api/guilds';
import { useUser } from '@/features/user/UserContext';
import { useGuilds } from './GuildContext';
import { LANGUAGES } from '@/i18n/languages.ts';
import { AVATAR_ICONS, BG_COLORS, ICON_COLORS } from '@/features/user/settings/constants';

const resolveColor = (cssVar: string): string => {
  const varName = cssVar
    .replace(/^var\(/, '')
    .replace(/\)$/, '')
    .trim();
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

export const NoGuildPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { refresh } = useGuilds();
  const [name, setName] = useState('');
  const resolvedIconColors = useMemo(() => ICON_COLORS.map(resolveColor), []);
  const resolvedBgColors = useMemo(() => BG_COLORS.map(resolveColor), []);
  const [selectedIcon, setSelectedIcon] = useState('Leaf');
  const [iconColor, setIconColor] = useState(resolvedIconColors[0] ?? '');
  const [iconBg, setIconBg] = useState(resolvedBgColors[0] ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const displayName = user?.displayName ?? user?.username ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 3) return;

    setIsLoading(true);
    setError(false);
    try {
      const guild = await createGuild(trimmed, {
        iconUrl: '',
        icon: {
          name: selectedIcon,
          color: iconColor,
          bg: iconBg,
        },
      });
      refresh();
      navigate(`/guilds/${guild.guildId}`);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

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

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-4">
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

              <div className="flex items-center gap-3 border border-border-2 rounded-sm p-3">
                <Avatar
                  alt={name || t('guild.noGuild.namePlaceholder')}
                  icon={selectedIcon}
                  color={iconColor}
                  bg={iconBg}
                  size={56}
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
                    {t('guild.noGuild.logoLabel')}
                  </p>
                  <p className="text-sm text-text-2">{t('guild.noGuild.logoPreview')}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border border-border-2 rounded-sm p-3">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
                  {t('guild.noGuild.logoIconLabel')}
                </p>
                <div className="grid grid-cols-10 gap-1.5">
                  {AVATAR_ICONS.map((iconName) => {
                    const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
                    if (!Icon) return null;
                    return (
                      <IconButton
                        key={iconName}
                        size="medium"
                        variant="filled"
                        selected={selectedIcon === iconName}
                        onClick={() => setSelectedIcon(iconName)}
                        title={iconName}
                        type="button"
                        disabled={isLoading}
                      >
                        <Icon size={16} />
                      </IconButton>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
                  {t('guild.noGuild.logoIconColorLabel')}
                </p>
                <ColorSwatches
                  colors={resolvedIconColors}
                  selected={iconColor}
                  onSelect={setIconColor}
                  showCustomPicker
                />
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
                  {t('guild.noGuild.logoBgColorLabel')}
                </p>
                <ColorSwatches
                  colors={resolvedBgColors}
                  selected={iconBg}
                  onSelect={setIconBg}
                  showCustomPicker
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={isLoading} disabled={name.trim().length < 3}>
                {t('guild.noGuild.createButton')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
