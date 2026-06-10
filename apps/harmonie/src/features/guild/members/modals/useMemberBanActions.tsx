import { useState } from 'react';
import { BanMemberModal } from '@/features/guild/members/modals/BanMemberModal';
import { useCurrentGuild, useGuilds } from '@/features/guild/GuildContext';
import { useGuildPermissions } from '@/features/guild/useGuildPermissions';
import type { GuildMember } from '@/types/guild';

export const useMemberBanActions = (guildId: string | undefined, onBanned?: () => void) => {
  const [banTarget, setBanTarget] = useState<GuildMember | null>(null);
  const { fetchGuildMembers } = useGuilds();
  const { guild } = useCurrentGuild();
  const { canBanMember } = useGuildPermissions(guild);

  const banModal =
    banTarget && guildId ? (
      <BanMemberModal
        guildId={guildId}
        member={banTarget}
        onClose={() => setBanTarget(null)}
        onBanned={() => {
          fetchGuildMembers(guildId, true);
          setBanTarget(null);
          onBanned?.();
        }}
      />
    ) : null;

  return {
    banModal,
    canBanMember,
    openBanModal: setBanTarget,
  };
};
