import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Guild } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildSettingsModal } from './GuildSettingsModal';

const mocks = vi.hoisted(() => ({
  permissions: {
    canAccessDangerZone: true,
    canLeaveGuild: true,
    canManageGuild: true,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  ModalPanel: ({
    children,
    closeLabel,
    onClose,
    sidebar,
    title,
  }: {
    children: ReactNode;
    closeLabel: string;
    onClose: () => void;
    sidebar: ReactNode;
    title: string;
  }) => (
    <section aria-label={title}>
      <button type="button" onClick={onClose}>
        {closeLabel}
      </button>
      <nav>{sidebar}</nav>
      <main>{children}</main>
    </section>
  ),
  NavList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  NavListItem: ({
    active,
    label,
    onClick,
  }: {
    active: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button type="button" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  ),
  Separator: () => <hr />,
}));

vi.mock('@/features/guild/useGuildPermissions', () => ({
  useGuildPermissions: () => mocks.permissions,
}));

vi.mock('@/features/guild/form/GuildForm', () => ({
  GuildForm: ({
    guild,
    onCancel,
    onSuccess,
    onUpdated,
  }: {
    guild: Guild;
    onCancel: () => void;
    onSuccess: () => void;
    onUpdated: (guild: Guild) => void;
  }) => (
    <section>
      identity:{guild.name}
      <button type="button" onClick={() => onUpdated({ ...guild, name: 'Updated' })}>
        updated
      </button>
      <button type="button" onClick={onCancel}>
        cancel form
      </button>
      <button type="button" onClick={onSuccess}>
        success
      </button>
    </section>
  ),
}));

vi.mock('@/features/guild/members/admin/GuildMembers', () => ({
  GuildMembers: ({ onOwnershipTransferred }: { onOwnershipTransferred: () => void }) => (
    <section>
      members
      <button type="button" onClick={onOwnershipTransferred}>
        transferred
      </button>
    </section>
  ),
}));

vi.mock('@/features/guild/invites/GuildInvites', () => ({
  GuildInvites: ({ guildId }: { guildId: string }) => <section>invites:{guildId}</section>,
}));

vi.mock('@/features/guild/members/admin/GuildBans', () => ({
  GuildBans: ({ guildId }: { guildId: string }) => <section>bans:{guildId}</section>,
}));

vi.mock('@/features/guild/settings/GuildDangerSection', () => ({
  GuildDangerSection: ({
    guildId,
    onDeleted,
  }: {
    guildId: string;
    onDeleted: (guildId: string) => void;
  }) => (
    <section>
      danger:{guildId}
      <button type="button" onClick={() => onDeleted(guildId)}>
        deleted
      </button>
    </section>
  ),
}));

vi.mock('@/features/guild/settings/GuildLeaveSection', () => ({
  GuildLeaveSection: ({
    guildId,
    onLeave,
  }: {
    guildId: string;
    onLeave: (guildId: string) => void;
  }) => (
    <section>
      leave:{guildId}
      <button type="button" onClick={() => onLeave(guildId)}>
        left
      </button>
    </section>
  ),
}));

const guild: Guild = {
  guildId: 'guild-1',
  name: 'Guild',
  ownerUserId: 'owner-1',
  role: 'Admin',
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
  iconFileId: null,
  icon: null,
};

const renderModal = (overrides?: Partial<React.ComponentProps<typeof GuildSettingsModal>>) =>
  render(
    <GuildSettingsModal
      guild={guild}
      onClose={vi.fn()}
      onUpdated={vi.fn()}
      onDeleted={vi.fn()}
      onLeave={vi.fn()}
      {...overrides}
    />
  );

describe('GuildSettingsModal', () => {
  beforeEach(() => {
    mocks.permissions.canAccessDangerZone = true;
    mocks.permissions.canLeaveGuild = true;
    mocks.permissions.canManageGuild = true;
  });

  it('renders identity by default and switches through admin sections', () => {
    const onClose = vi.fn();
    const onUpdated = vi.fn();
    const onDeleted = vi.fn();
    const onLeave = vi.fn();

    renderModal({ onClose, onUpdated, onDeleted, onLeave });

    expect(screen.getByLabelText('guild.edit.nav.identity')).toBeInTheDocument();
    expect(screen.getByText('identity:Guild')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.edit.nav.members' }));
    expect(screen.getByText('members')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'transferred' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'guild.edit.nav.invites' }));
    expect(screen.getByText('invites:guild-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.edit.nav.bans' }));
    expect(screen.getByText('bans:guild-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.edit.nav.danger' }));
    fireEvent.click(screen.getByRole('button', { name: 'deleted' }));
    expect(onDeleted).toHaveBeenCalledWith('guild-1');

    fireEvent.click(screen.getByRole('button', { name: 'guild.edit.nav.leave' }));
    fireEvent.click(screen.getByRole('button', { name: 'left' }));
    expect(onLeave).toHaveBeenCalledWith('guild-1');

    fireEvent.click(screen.getByRole('button', { name: 'guild.edit.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'guild.edit.nav.identity' }));
    fireEvent.click(screen.getByRole('button', { name: 'updated' }));
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }));
  });

  it('falls back from forbidden initial sections and hides management-only nav', () => {
    mocks.permissions.canAccessDangerZone = false;
    mocks.permissions.canLeaveGuild = true;
    mocks.permissions.canManageGuild = false;

    const { unmount } = renderModal({ initialSection: 'danger' });

    expect(screen.getByLabelText('guild.edit.nav.leave')).toBeInTheDocument();
    expect(screen.getByText('leave:guild-1')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'guild.edit.nav.identity' })
    ).not.toBeInTheDocument();

    unmount();
    mocks.permissions.canLeaveGuild = false;
    mocks.permissions.canManageGuild = true;
    renderModal({ initialSection: 'leave' });

    expect(screen.getByLabelText('guild.edit.nav.identity')).toBeInTheDocument();
    expect(screen.getByText('identity:Guild')).toBeInTheDocument();
  });
});
