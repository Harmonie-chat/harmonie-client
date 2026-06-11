import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGuildPermissions } from './useGuildPermissions';
import type { Guild, GuildMember } from '@/types/guild';

let currentUser: { userId: string } | null = null;

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: currentUser }),
}));

const guild = (input: Partial<Guild> = {}): Guild => ({
  guildId: 'guild-1',
  name: 'Guild',
  ownerUserId: 'owner-1',
  role: 'Member',
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  iconFileId: null,
  icon: null,
  ...input,
});

const member = (input: Partial<GuildMember> = {}): GuildMember => ({
  userId: 'member-1',
  username: 'member',
  displayName: null,
  isActive: true,
  role: 'Member',
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  ...input,
});

describe('useGuildPermissions', () => {
  it('denies guild actions when no guild is selected', () => {
    currentUser = { userId: 'user-1' };

    const { result } = renderHook(() => useGuildPermissions(null));

    expect(result.current.canManageGuild).toBe(false);
    expect(result.current.canLeaveGuild).toBe(false);
    expect(result.current.canOpenGuildContextMenu).toBe(false);
    expect(result.current.canBanMember(member())).toBe(false);
    expect(result.current.canTransferOwnership(member())).toBe(false);
  });

  it('allows owners to manage the guild and transfer ownership to another member', () => {
    currentUser = { userId: 'owner-1' };

    const { result } = renderHook(() => useGuildPermissions(guild()));

    expect(result.current.isOwner).toBe(true);
    expect(result.current.canManageGuild).toBe(true);
    expect(result.current.canManageChannels).toBe(true);
    expect(result.current.canAccessDangerZone).toBe(true);
    expect(result.current.canLeaveGuild).toBe(false);
    expect(result.current.canRemoveMember(member({ userId: 'member-2' }))).toBe(true);
    expect(result.current.canTransferOwnership(member({ userId: 'member-2' }))).toBe(true);
  });

  it('prevents owners from acting on themselves', () => {
    currentUser = { userId: 'owner-1' };

    const { result } = renderHook(() => useGuildPermissions(guild()));

    expect(result.current.canBanMember(member({ userId: 'owner-1' }))).toBe(false);
    expect(result.current.canTransferOwnership(member({ userId: 'owner-1' }))).toBe(false);
  });

  it('allows admins to act on regular members but not owners or admins', () => {
    currentUser = { userId: 'admin-1' };

    const { result } = renderHook(() => useGuildPermissions(guild({ role: 'Admin' })));

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManageGuild).toBe(true);
    expect(result.current.canLeaveGuild).toBe(true);
    expect(result.current.canEditMemberRole(member({ role: 'Member' }))).toBe(true);
    expect(result.current.canEditMemberRole(member({ userId: 'owner-1' }))).toBe(false);
    expect(result.current.canEditMemberRole(member({ role: 'Admin' }))).toBe(false);
    expect(result.current.canTransferOwnership(member())).toBe(false);
  });

  it('keeps regular members away from management actions', () => {
    currentUser = { userId: 'member-1' };

    const { result } = renderHook(() => useGuildPermissions(guild()));

    expect(result.current.canManageGuild).toBe(false);
    expect(result.current.canLeaveGuild).toBe(true);
    expect(result.current.canRemoveMember(member({ userId: 'member-2' }))).toBe(false);
  });
});
