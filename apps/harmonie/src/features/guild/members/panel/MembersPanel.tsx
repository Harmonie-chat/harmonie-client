import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IconButton } from '@harmonie/ui';
import type { GuildMember } from '@/types/guild';
import { MemberItem } from '@/shared/members/MemberItem';
import { useMemberBanActions } from '@/features/guild/members/modals/useMemberBanActions';
import { useMemberRemoveActions } from '@/features/guild/members/modals/useMemberRemoveActions';
import { MemberPopover } from '@/shared/members/MemberPopover';
import { useGuildMembers } from '@/features/guild/GuildContext';

interface SelectedMember {
  guildId: string;
  member: GuildMember;
  rect: DOMRect;
}

interface MembersPanelProps {
  onClose: () => void;
}

export const MembersPanel = ({ onClose }: MembersPanelProps) => {
  const { t } = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const [selected, setSelected] = useState<SelectedMember | null>(null);

  const { banModal, canBanMember, openBanModal } = useMemberBanActions(guildId, () => {
    setSelected(null);
  });

  const { removeModal, canRemoveMember, openRemoveModal } = useMemberRemoveActions(guildId, () => {
    setSelected(null);
  });

  const membersOrNull = useGuildMembers(guildId);
  const loading = membersOrNull === null;
  const members = membersOrNull ?? [];

  const selectedMember = selected?.guildId === guildId ? selected : null;

  const handleSelect = (member: GuildMember, rect: DOMRect) => {
    if (!guildId) return;
    setSelected((prev) =>
      prev?.guildId === guildId && prev.member.userId === member.userId
        ? null
        : { guildId, member, rect }
    );
  };

  const onlineMembers = members.filter((m) => m.isActive);
  const offlineMembers = members.filter((m) => !m.isActive);

  return (
    <>
      <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-surface-1 lg:static lg:z-auto lg:w-52 lg:shrink-0 lg:rounded-md">
        <div className="flex h-14 shrink-0 items-center justify-between bg-surface-2 px-4 pt-[env(safe-area-inset-top)] lg:rounded-t-md lg:pt-0">
          <span className="text-sm font-semibold text-text-1">{t('guild.members.title')}</span>
          <IconButton size="small" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <p className="px-3 text-sm text-text-3">{t('guild.members.loading')}</p>
          ) : (
            <>
              {onlineMembers.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold text-text-3 uppercase tracking-wide">
                    {t('guild.members.online', { count: onlineMembers.length })}
                  </p>
                  {onlineMembers.map((m) => (
                    <MemberItem
                      key={m.userId}
                      member={m}
                      onSelect={handleSelect}
                      onBan={canBanMember(m) ? openBanModal : undefined}
                      onRemove={canRemoveMember(m) ? openRemoveModal : undefined}
                    />
                  ))}
                </div>
              )}
              {offlineMembers.length > 0 && (
                <div className={onlineMembers.length > 0 ? 'mt-4' : ''}>
                  <p className="px-3 py-1 text-xs font-semibold text-text-3 uppercase tracking-wide">
                    {t('guild.members.offline', { count: offlineMembers.length })}
                  </p>
                  {offlineMembers.map((m) => (
                    <MemberItem
                      key={m.userId}
                      member={m}
                      onSelect={handleSelect}
                      onBan={canBanMember(m) ? openBanModal : undefined}
                      onRemove={canRemoveMember(m) ? openRemoveModal : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedMember && guildId && (
        <MemberPopover
          member={selectedMember.member}
          guildId={guildId}
          anchorRect={selectedMember.rect}
          onClose={() => setSelected(null)}
          onRemoved={() => setSelected(null)}
          onBanned={() => setSelected(null)}
        />
      )}
      {banModal}
      {removeModal}
    </>
  );
};
