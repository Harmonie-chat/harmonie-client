import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Channel } from '@/types/guild';
import { EditChannelModal } from './EditChannelModal';

const api = vi.hoisted(() => ({
  deleteChannel: vi.fn(),
  updateChannel: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  Button: ({
    children,
    disabled,
    isLoading,
    onClick,
    type,
  }: {
    children: ReactNode;
    disabled?: boolean;
    isLoading?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit';
  }) => (
    <button
      type={type ?? 'button'}
      disabled={disabled}
      data-loading={String(isLoading)}
      onClick={onClick}
    >
      {children}
    </button>
  ),
  EmojiInput: ({
    error,
    label,
    maxLength,
    onChange,
    value,
  }: {
    error?: string;
    label: string;
    maxLength?: number;
    onChange: (value: string) => void;
    value: string;
  }) => (
    <input
      aria-label={label}
      data-error={error ?? ''}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  ),
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
    <section role="dialog" aria-label={title} data-close-label={closeLabel}>
      <aside>{sidebar}</aside>
      <button type="button" onClick={onClose}>
        close panel
      </button>
      {children}
    </section>
  ),
  NavList: ({ children }: { children: ReactNode }) => <nav>{children}</nav>,
  NavListItem: ({
    active,
    label,
    onClick,
  }: {
    active?: boolean;
    icon?: ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <button type="button" data-active={String(active)} onClick={onClick}>
      {label}
    </button>
  ),
  Separator: () => <hr />,
}));

vi.mock('@/api/channels', () => ({
  deleteChannel: (...args: unknown[]) => api.deleteChannel(...args),
  updateChannel: (...args: unknown[]) => api.updateChannel(...args),
}));

const baseChannel: Channel = {
  channelId: 'channel-1',
  name: 'general',
  type: 'Text',
  isDefault: false,
  position: 1,
};

describe('EditChannelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renames a channel with a trimmed name and closes through cancel', async () => {
    const onClose = vi.fn();
    const onUpdated = vi.fn();
    const updated = { ...baseChannel, name: 'news' };
    api.updateChannel.mockResolvedValue(updated);

    render(
      <EditChannelModal
        channel={baseChannel}
        onClose={onClose}
        onUpdated={onUpdated}
        onDeleted={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'guild.channels.edit.renameTitle' })).toHaveAttribute(
      'data-close-label',
      'guild.channels.edit.cancel'
    );
    expect(screen.getByRole('button', { name: 'guild.channels.edit.save' })).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'guild.channels.edit.nameLabel' }), {
      target: { value: '  news  ' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.channels.edit.save' }));

    expect(api.updateChannel).toHaveBeenCalledWith('channel-1', { name: 'news' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'guild.channels.edit.save' })).toHaveAttribute(
        'data-loading',
        'false'
      )
    );
    expect(onUpdated).toHaveBeenCalledWith(updated);

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows save errors and clears them when editing again', async () => {
    api.updateChannel.mockRejectedValue(new Error('nope'));
    render(
      <EditChannelModal
        channel={baseChannel}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'guild.channels.edit.nameLabel' });
    fireEvent.change(input, { target: { value: 'broken' } });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.channels.edit.save' }));

    expect(
      await screen.findByRole('textbox', { name: 'guild.channels.edit.nameLabel' })
    ).toHaveAttribute('data-error', 'guild.channels.edit.error');

    fireEvent.change(input, { target: { value: 'fixed' } });
    expect(input).toHaveAttribute('data-error', '');
  });

  it('does not save blank or unchanged names and can navigate back from danger to rename', () => {
    const onClose = vi.fn();
    render(
      <EditChannelModal
        channel={baseChannel}
        initialSection="danger"
        onClose={onClose}
        onUpdated={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.navRename' }));
    expect(
      screen.getByRole('dialog', { name: 'guild.channels.edit.renameTitle' })
    ).toBeInTheDocument();

    fireEvent.submit(screen.getByRole('button', { name: 'guild.channels.edit.save' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'guild.channels.edit.nameLabel' }), {
      target: { value: '   ' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.channels.edit.save' }));

    expect(api.updateChannel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.navDanger' }));
    expect(
      screen.getByRole('dialog', { name: 'guild.channels.edit.dangerZone' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close panel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('confirms and deletes a non-default channel', async () => {
    const onDeleted = vi.fn();
    api.deleteChannel.mockResolvedValue(undefined);

    render(
      <EditChannelModal
        channel={baseChannel}
        initialSection="danger"
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        onDeleted={onDeleted}
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'guild.channels.edit.dangerZone' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /guild.channels.edit.deleteButton/ }));
    expect(
      screen.getByRole('button', { name: 'guild.channels.edit.deleteCancel' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.deleteCancel' }));
    expect(
      screen.queryByRole('button', { name: 'guild.channels.edit.deleteConfirm' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /guild.channels.edit.deleteButton/ }));
    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.deleteConfirm' }));

    expect(api.deleteChannel).toHaveBeenCalledWith('channel-1');
    expect(
      await screen.findByRole('button', { name: 'guild.channels.edit.deleteConfirm' })
    ).toHaveAttribute('data-loading', 'true');
    expect(onDeleted).toHaveBeenCalledWith('channel-1');
  });

  it('shows delete errors and hides danger nav for default channels', async () => {
    api.deleteChannel.mockRejectedValue(new Error('nope'));
    const { rerender } = render(
      <EditChannelModal
        channel={baseChannel}
        initialSection="danger"
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /guild.channels.edit.deleteButton/ }));
    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.deleteConfirm' }));

    expect(await screen.findByText('guild.channels.edit.deleteError')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'guild.channels.edit.deleteConfirm' })
    ).toHaveAttribute('data-loading', 'false');

    rerender(
      <EditChannelModal
        channel={{ ...baseChannel, isDefault: true }}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'guild.channels.edit.navDanger' })
    ).not.toBeInTheDocument();
  });
});
