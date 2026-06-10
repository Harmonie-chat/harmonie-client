import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateMemberRole } from '@/api/guilds';
import { useGuildMembers, useGuilds } from '@/features/guild/GuildContext';
import { useGuildPermissions } from '@/features/guild/useGuildPermissions';
import { MemberRow } from '@/features/guild/members/admin/MemberRow';
import type { Guild, GuildMemberRole } from '@/types/guild';

interface GuildMembersProps {
  guild: Guild;
  onOwnershipTransferred?: () => void;
}

export const GuildMembers = ({ guild, onOwnershipTransferred }: GuildMembersProps) => {
  const { t } = useTranslation();
  const members = useGuildMembers(guild.guildId);
  const { fetchGuildMembers, fetchGuilds } = useGuilds();
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const { canRemoveMember, canBanMember, canEditMemberRole, canTransferOwnership } =
    useGuildPermissions(guild);

  const refresh = () => fetchGuildMembers(guild.guildId, true);

  const handleOwnershipTransferred = () => {
    fetchGuilds();
    fetchGuildMembers(guild.guildId, true);
    onOwnershipTransferred?.();
  };

  const handleRoleChange = async (userId: string, role: GuildMemberRole) => {
    setChangingRoleId(userId);
    try {
      await updateMemberRole(guild.guildId, userId, { role });
      refresh();
    } catch {
      // Nothing to revert — the list will reflect the current server state
    }
    setChangingRoleId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-2">{t('guild.members.admin.description')}</p>

      {members === null ? (
        <p className="text-sm text-text-3">{t('guild.members.admin.loading')}</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-text-3">{t('guild.members.admin.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              guildId={guild.guildId}
              permissions={{
                isOwner: member.userId === guild.ownerUserId,
                canRemove: canRemoveMember(member),
                canBan: canBanMember(member),
                canEditRole: canEditMemberRole(member),
                canTransferOwnership: canTransferOwnership(member),
              }}
              roleState={{ isChangingRole: changingRoleId === member.userId }}
              onRemoved={refresh}
              onBanned={refresh}
              onRoleChange={handleRoleChange}
              onOwnershipTransferred={handleOwnershipTransferred}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
