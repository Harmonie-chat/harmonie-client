import { useUser } from '@/features/user/UserContext';
import type { Guild, GuildMember } from '@/types/guild';

export const useGuildPermissions = (guild: Guild | null | undefined) => {
  const { user } = useUser();

  const isOwner = user?.userId === guild?.ownerUserId;
  const isAdmin = guild?.role === 'Admin';
  const canManageGuild = isAdmin || isOwner;
  const canManageChannels = canManageGuild;
  const canAccessDangerZone = isOwner;
  const canLeaveGuild = Boolean(guild) && !isOwner;
  const canOpenGuildContextMenu = Boolean(guild);

  const canActOnMember = (member: GuildMember): boolean => {
    if (!guild) return false;
    if (isOwner) return member.userId !== guild.ownerUserId;
    if (!isAdmin) return false;
    if (member.userId === guild.ownerUserId) return false;
    return member.role !== 'Admin';
  };

  const canBanMember = canActOnMember;
  const canRemoveMember = canActOnMember;
  const canEditMemberRole = canActOnMember;

  const canTransferOwnership = (member: GuildMember): boolean => {
    if (!guild || !isOwner) return false;
    return member.userId !== guild.ownerUserId;
  };

  return {
    isAdmin,
    isOwner,
    canAccessDangerZone,
    canBanMember,
    canEditMemberRole,
    canRemoveMember,
    canTransferOwnership,
    canLeaveGuild,
    canManageChannels,
    canManageGuild,
    canOpenGuildContextMenu,
  };
};
