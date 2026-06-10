import { useState } from 'react';
import { DoorOpen, Mailbox, Pencil, ShieldBan, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModalPanel, NavList, NavListItem, Separator } from '@harmonie/ui';
import type { Guild } from '@/types/guild';
import { GuildDangerSection } from '@/features/guild/settings/GuildDangerSection';
import { GuildLeaveSection } from '@/features/guild/settings/GuildLeaveSection';
import { GuildForm } from '@/features/guild/form/GuildForm';
import { GuildInvites } from '@/features/guild/invites/GuildInvites';
import { GuildBans } from '@/features/guild/members/admin/GuildBans';
import { GuildMembers } from '@/features/guild/members/admin/GuildMembers';
import { useGuildPermissions } from '@/features/guild/useGuildPermissions';
import { AdminSectionMenu } from '@/features/guild/settings/adminSection';

interface EditGuildModalProps {
  guild: Guild;
  onClose: () => void;
  onUpdated: (guild: Guild) => void;
  onDeleted: (guildId: string) => void;
  onLeave: (guildId: string) => void;
  initialSection?: AdminSectionMenu;
}

export const GuildSettingsModal = ({
  guild,
  onClose,
  onUpdated,
  onDeleted,
  onLeave,
  initialSection = 'identity',
}: EditGuildModalProps) => {
  const { t } = useTranslation();
  const { canAccessDangerZone, canLeaveGuild, canManageGuild } = useGuildPermissions(guild);
  const [section, setSection] = useState<AdminSectionMenu>(
    initialSection === 'danger' && !canAccessDangerZone
      ? canLeaveGuild
        ? 'leave'
        : 'identity'
      : initialSection === 'leave' && !canLeaveGuild
        ? 'identity'
        : initialSection
  );

  const sidebar = (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-text-3 uppercase tracking-wider px-3 pt-1 pb-2">
        {t('guild.contextMenu.edit')}
      </p>
      <Separator />
      <NavList className="mt-2">
        {canManageGuild && (
          <NavListItem
            icon={<Pencil size={15} />}
            label={t('guild.edit.nav.identity')}
            active={section === 'identity'}
            onClick={() => setSection('identity')}
          />
        )}
        {canManageGuild && (
          <NavListItem
            icon={<Users size={15} />}
            label={t('guild.edit.nav.members')}
            active={section === 'members'}
            onClick={() => setSection('members')}
          />
        )}
        {canManageGuild && (
          <NavListItem
            icon={<Mailbox size={15} />}
            label={t('guild.edit.nav.invites')}
            active={section === 'invites'}
            onClick={() => setSection('invites')}
          />
        )}
        {canManageGuild && (
          <NavListItem
            icon={<ShieldBan size={15} />}
            label={t('guild.edit.nav.bans')}
            active={section === 'bans'}
            onClick={() => setSection('bans')}
          />
        )}
        {canAccessDangerZone && (
          <NavListItem
            icon={<Trash2 size={15} />}
            label={t('guild.edit.nav.danger')}
            active={section === 'danger'}
            onClick={() => setSection('danger')}
          />
        )}
        {canLeaveGuild && (
          <NavListItem
            icon={<DoorOpen size={15} />}
            label={t('guild.edit.nav.leave')}
            active={section === 'leave'}
            onClick={() => setSection('leave')}
          />
        )}
      </NavList>
    </div>
  );

  return (
    <ModalPanel
      title={t(`guild.edit.nav.${section}`)}
      closeLabel={t('guild.edit.cancel')}
      onClose={onClose}
      sidebar={sidebar}
    >
      {section === 'identity' && canManageGuild && (
        <GuildForm
          mode="edit"
          guild={guild}
          autoFocus
          onUpdated={onUpdated}
          onCancel={onClose}
          onSuccess={onClose}
        />
      )}

      {section === 'members' && canManageGuild && (
        <GuildMembers guild={guild} onOwnershipTransferred={onClose} />
      )}

      {section === 'invites' && canManageGuild && <GuildInvites guildId={guild.guildId} />}

      {section === 'bans' && canManageGuild && <GuildBans guildId={guild.guildId} />}

      {section === 'danger' && canAccessDangerZone && (
        <GuildDangerSection guildId={guild.guildId} onDeleted={onDeleted} />
      )}

      {section === 'leave' && canLeaveGuild && (
        <GuildLeaveSection guildId={guild.guildId} onLeave={onLeave} />
      )}
    </ModalPanel>
  );
};
