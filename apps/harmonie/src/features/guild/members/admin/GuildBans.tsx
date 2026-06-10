import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listGuildBans } from '@/api/guilds';
import { BanItem } from '@/features/guild/members/admin/BanItem';
import type { GuildBan } from '@/types/guild';

interface GuildBansProps {
  guildId: string;
}

interface GuildBansState {
  guildId: string;
  bans: GuildBan[];
  isLoading: boolean;
}

export const GuildBans = ({ guildId }: GuildBansProps) => {
  const { t } = useTranslation();
  const [state, setState] = useState<GuildBansState>({
    guildId: '',
    bans: [],
    isLoading: true,
  });
  const bans = state.guildId === guildId ? state.bans : [];
  const isLoading = state.guildId !== guildId || state.isLoading;

  useEffect(() => {
    listGuildBans(guildId)
      .then((data) => setState({ guildId, bans: data.bans, isLoading: false }))
      .catch(() => setState({ guildId, bans: [], isLoading: false }));
  }, [guildId]);

  const handleUnbanned = (userId: string) => {
    setState((prev) => ({
      ...prev,
      bans: prev.guildId === guildId ? prev.bans.filter((b) => b.userId !== userId) : [],
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t('guild.bans.description')}</p>

      {isLoading ? (
        <p className="text-sm text-text-3">{t('guild.bans.loading')}</p>
      ) : bans.length === 0 ? (
        <p className="text-sm text-text-3">{t('guild.bans.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bans.map((ban) => (
            <BanItem key={ban.userId} ban={ban} guildId={guildId} onUnbanned={handleUnbanned} />
          ))}
        </ul>
      )}
    </div>
  );
};
