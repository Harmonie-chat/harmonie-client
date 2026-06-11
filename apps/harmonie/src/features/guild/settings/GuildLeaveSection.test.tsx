import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildLeaveSection } from './GuildLeaveSection';

const mocks = vi.hoisted(() => ({
  leaveGuild: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/guilds', () => ({
  leaveGuild: mocks.leaveGuild,
}));

describe('GuildLeaveSection', () => {
  beforeEach(() => {
    mocks.leaveGuild.mockReset();
  });

  it('confirms and cancels leaving a guild', async () => {
    const onLeave = vi.fn();
    render(<GuildLeaveSection guildId="guild-1" onLeave={onLeave} />);

    await userEvent.click(screen.getByRole('button', { name: /guild.edit.leaveButton/ }));
    expect(screen.getByRole('button', { name: 'guild.edit.leaveConfirm' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'guild.edit.leaveCancel' }));
    expect(
      screen.queryByRole('button', { name: 'guild.edit.leaveConfirm' })
    ).not.toBeInTheDocument();
  });

  it('leaves the guild and reports API errors', async () => {
    const onLeave = vi.fn();
    mocks.leaveGuild.mockRejectedValueOnce(new Error('nope')).mockResolvedValueOnce(undefined);
    render(<GuildLeaveSection guildId="guild-1" onLeave={onLeave} />);

    await userEvent.click(screen.getByRole('button', { name: /guild.edit.leaveButton/ }));
    await userEvent.click(screen.getByRole('button', { name: 'guild.edit.leaveConfirm' }));

    expect(await screen.findByText('guild.edit.leaveError')).toBeInTheDocument();
    expect(onLeave).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'guild.edit.leaveConfirm' }));

    await waitFor(() => expect(onLeave).toHaveBeenCalledWith('guild-1'));
  });
});
