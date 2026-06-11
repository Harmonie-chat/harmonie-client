import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildDangerSection } from './GuildDangerSection';

const mocks = vi.hoisted(() => ({
  deleteGuild: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/guilds', () => ({
  deleteGuild: mocks.deleteGuild,
}));

describe('GuildDangerSection', () => {
  beforeEach(() => {
    mocks.deleteGuild.mockReset();
  });

  it('confirms and cancels guild deletion', async () => {
    const onDeleted = vi.fn();
    render(<GuildDangerSection guildId="guild-1" onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole('button', { name: /guild.edit.deleteButton/ }));
    expect(screen.getByRole('button', { name: 'guild.edit.deleteConfirm' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'guild.edit.deleteCancel' }));
    expect(
      screen.queryByRole('button', { name: 'guild.edit.deleteConfirm' })
    ).not.toBeInTheDocument();
  });

  it('deletes the guild and reports API errors', async () => {
    const onDeleted = vi.fn();
    mocks.deleteGuild.mockRejectedValueOnce(new Error('nope')).mockResolvedValueOnce(undefined);
    render(<GuildDangerSection guildId="guild-1" onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole('button', { name: /guild.edit.deleteButton/ }));
    await userEvent.click(screen.getByRole('button', { name: 'guild.edit.deleteConfirm' }));

    expect(await screen.findByText('guild.edit.deleteError')).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'guild.edit.deleteConfirm' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('guild-1'));
  });
});
