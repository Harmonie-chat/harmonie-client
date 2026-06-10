import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton } from '@harmonie/ui';
import { unbanMember } from '@/api/guilds';
import { GuildMemberCard } from '@/features/guild/members/shared/GuildMemberCard';
import { GuildMemberIdentity } from '@/features/guild/members/shared/GuildMemberIdentity';
import type { GuildBan } from '@/types/guild';

interface BanItemProps {
  ban: GuildBan;
  guildId: string;
  onUnbanned: (userId: string) => void;
}

export const BanItem = ({ ban, guildId, onUnbanned }: BanItemProps) => {
  const { t } = useTranslation();
  const label = ban.displayName ?? ban.username;

  const [confirming, setConfirming] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const handleConfirm = async () => {
    setIsActing(true);
    const error = await unbanMember(guildId, ban.userId).then(
      () => {
        onUnbanned(ban.userId);
        return undefined;
      },
      (err: unknown) => err
    );
    setIsActing(false);
    setConfirming(false);
    if (error) throw error;
  };

  return (
    <GuildMemberCard user={ban}>
      {confirming ? (
        <>
          <p className="flex-1 text-sm font-medium text-text-2 truncate">
            {t('guild.bans.confirmUnban', { name: label })}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="tertiary"
              onClick={() => setConfirming(false)}
              disabled={isActing}
              className="px-3 py-1.5 text-xs"
            >
              {t('guild.bans.cancel')}
            </Button>
            <Button
              variant="primary"
              isLoading={isActing}
              onClick={handleConfirm}
              className="px-3 py-1.5 text-xs"
            >
              {t('guild.bans.unban')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <GuildMemberIdentity label={label} subtitle={ban.reason ?? undefined} />
          <IconButton
            size="small"
            variant="ghost"
            onClick={() => setConfirming(true)}
            aria-label={t('guild.bans.unban')}
            title={t('guild.bans.unban')}
          >
            <ShieldOff size={13} />
          </IconButton>
        </>
      )}
    </GuildMemberCard>
  );
};
