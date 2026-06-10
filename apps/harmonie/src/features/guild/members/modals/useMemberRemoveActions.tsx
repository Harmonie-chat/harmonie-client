import { useState } from 'react';
import { RemoveMemberModal } from '@/features/guild/members/modals/RemoveMemberModal';
import { useCurrentGuild, useGuilds } from '@/features/guild/GuildContext';
import { useGuildPermissions } from '@/features/guild/useGuildPermissions';
import type { GuildMember } from '@/types/guild';

export const useMemberRemoveActions = (guildId: string | undefined, onRemoved?: () => void) => {
  const [removeTarget, setRemoveTarget] = useState<GuildMember | null>(null);
  const { fetchGuildMembers } = useGuilds();
  const { guild } = useCurrentGuild();
  const { canRemoveMember } = useGuildPermissions(guild);

  const removeModal =
    removeTarget && guildId ? (
      <RemoveMemberModal
        guildId={guildId}
        member={removeTarget}
        onClose={() => setRemoveTarget(null)}
        onRemoved={() => {
          fetchGuildMembers(guildId, true);
          setRemoveTarget(null);
          onRemoved?.();
        }}
      />
    ) : null;

  return {
    removeModal,
    canRemoveMember,
    openRemoveModal: setRemoveTarget,
  };
};
