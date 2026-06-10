import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, ShieldBan, UserMinus } from 'lucide-react';
import { UserPopover, type UserPopoverAction, type UserPopoverBadge } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useTheme } from '@/features/user/ThemeContext';
import { getUserGradient } from '@/shared/utils/user';
import { useCurrentGuild, useGuilds } from '@/features/guild/GuildContext';
import { useGuildPermissions } from '@/features/guild/useGuildPermissions';
import { useOpenDirectConversation } from '@/features/conversation/useOpenDirectConversation';
import { useUser } from '@/features/user/UserContext';
import { BanMemberModal } from '@/features/guild/members/modals/BanMemberModal';
import { RemoveMemberModal } from '@/features/guild/members/modals/RemoveMemberModal';
import type { GuildMember } from '@/types/guild';

interface MemberPopoverProps {
  member: GuildMember;
  guildId?: string;
  anchorRect: DOMRect;
  onClose: () => void;
  side?: 'left' | 'right';
  onRemoved?: () => void;
  onBanned?: () => void;
}

export const MemberPopover = ({
  member,
  guildId,
  anchorRect,
  onClose,
  side = 'left',
  onRemoved,
  onBanned,
}: MemberPopoverProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const avatarUrl = useFileBlobUrl(member.avatarFileId);
  const headerGradient = getUserGradient(member.userId, theme.endsWith('obsidian'));
  const label = member.displayName ?? member.username;
  const openDirectConversation = useOpenDirectConversation();
  const { user } = useUser();

  const [showBanModal, setShowBanModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const { fetchGuildMembers } = useGuilds();
  const { guild } = useCurrentGuild();
  const { canBanMember, canRemoveMember } = useGuildPermissions(guild);
  const isOwner = guild?.ownerUserId === member.userId;
  const isCurrentUser = user?.userId === member.userId;

  const actions: UserPopoverAction[] = [
    ...(!isCurrentUser
      ? [
          {
            label: t('conversation.sendDirectMessage'),
            icon: <MessageCircle size={13} />,
            onClick: () => {
              void openDirectConversation(member)
                .then(onClose)
                .catch(() => {});
            },
          },
        ]
      : []),
    ...(guildId && canRemoveMember(member)
      ? [
          {
            label: t('guild.members.kickAction'),
            icon: <UserMinus size={13} />,
            onClick: () => setShowRemoveModal(true),
          },
        ]
      : []),
    ...(guildId && canBanMember(member)
      ? [
          {
            label: t('guild.bans.banAction'),
            icon: <ShieldBan size={13} />,
            onClick: () => setShowBanModal(true),
          },
        ]
      : []),
  ];
  const badges: UserPopoverBadge[] = [
    { label: member.role },
    ...(isOwner && guildId
      ? [{ label: t('guild.members.popover.ownerLabel'), variant: 'owner' as const }]
      : []),
  ];

  return (
    <>
      <UserPopover
        anchorRect={anchorRect}
        onClose={onClose}
        label={label}
        username={member.displayName ? member.username : undefined}
        avatarUrl={avatarUrl}
        avatarIcon={member.avatar?.icon ?? 'PawPrint'}
        avatarColor={member.avatar?.color ?? 'var(--color-cat-1-fg)'}
        avatarBg={member.avatar?.bg ?? 'var(--color-cat-1)'}
        headerBackground={headerGradient}
        side={side}
        actions={actions}
        badges={badges}
        bioLabel={t('guild.members.popover.bioLabel')}
        bio={member.bio}
      />

      {guildId && showRemoveModal && (
        <RemoveMemberModal
          guildId={guildId}
          member={member}
          onClose={() => setShowRemoveModal(false)}
          onRemoved={() => {
            fetchGuildMembers(guildId, true);
            setShowRemoveModal(false);
            onClose();
            onRemoved?.();
          }}
        />
      )}

      {guildId && showBanModal && (
        <BanMemberModal
          guildId={guildId}
          member={member}
          onClose={() => setShowBanModal(false)}
          onBanned={() => {
            fetchGuildMembers(guildId, true);
            setShowBanModal(false);
            onClose();
            onBanned?.();
          }}
        />
      )}
    </>
  );
};
