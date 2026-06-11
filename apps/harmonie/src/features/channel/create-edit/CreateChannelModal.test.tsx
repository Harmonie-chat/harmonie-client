import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateChannelModal } from './CreateChannelModal';

const createChannel = vi.hoisted(() => vi.fn());

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
    placeholder,
    value,
  }: {
    error?: string;
    label: string;
    maxLength?: number;
    onChange: (value: string) => void;
    placeholder: string;
    value: string;
  }) => (
    <input
      aria-label={label}
      data-error={error ?? ''}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  ),
  Modal: ({
    children,
    closeLabel,
    onClose,
    title,
  }: {
    children: ReactNode;
    closeLabel: string;
    onClose: () => void;
    title: string;
  }) => (
    <section role="dialog" aria-label={title} data-close-label={closeLabel}>
      <button type="button" onClick={onClose}>
        close modal
      </button>
      {children}
    </section>
  ),
  RadioCard: ({
    checked,
    children,
    onChange,
    value,
  }: {
    checked: boolean;
    children: ReactNode;
    onChange: (value: string) => void;
    value: string;
  }) => (
    <label>
      <input
        type="radio"
        aria-label={String(children)}
        checked={checked}
        onChange={() => onChange(value)}
      />
      {children}
    </label>
  ),
}));

vi.mock('@/api/guilds', () => ({
  createChannel: (...args: unknown[]) => createChannel(...args),
}));

describe('CreateChannelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a trimmed voice channel and can cancel', async () => {
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const channel = {
      channelId: 'channel-1',
      name: 'Voice room',
      type: 'Voice',
      isDefault: false,
      position: 4,
    };
    createChannel.mockResolvedValue(channel);

    render(
      <CreateChannelModal
        guildId="guild-1"
        defaultType="Voice"
        nextPosition={4}
        onClose={onClose}
        onCreated={onCreated}
      />
    );

    expect(screen.getByRole('dialog', { name: 'guild.channels.create.title' })).toHaveAttribute(
      'data-close-label',
      'guild.channels.create.cancel'
    );
    expect(screen.getByRole('radio', { name: 'guild.channels.create.typeVoice' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'guild.channels.create.typeText' }));
    expect(screen.getByRole('radio', { name: 'guild.channels.create.typeText' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'guild.channels.create.typeVoice' }));
    expect(screen.getByRole('button', { name: 'guild.channels.create.submit' })).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'guild.channels.create.nameLabel' }), {
      target: { value: '  Voice room  ' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.channels.create.submit' }));

    expect(createChannel).toHaveBeenCalledWith('guild-1', {
      name: 'Voice room',
      type: 'Voice',
      position: 4,
    });
    expect(
      await screen.findByRole('button', { name: 'guild.channels.create.submit' })
    ).toHaveAttribute('data-loading', 'false');
    expect(onCreated).toHaveBeenCalledWith(channel);

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.create.cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'close modal' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('switches channel type and shows create errors until the name changes', async () => {
    createChannel.mockRejectedValue(new Error('nope'));
    render(
      <CreateChannelModal
        guildId="guild-1"
        nextPosition={1}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'guild.channels.create.typeVoice' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'guild.channels.create.nameLabel' }), {
      target: { value: 'broken' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.channels.create.submit' }));

    expect(createChannel).toHaveBeenCalledWith('guild-1', {
      name: 'broken',
      type: 'Voice',
      position: 1,
    });
    expect(
      await screen.findByRole('textbox', { name: 'guild.channels.create.nameLabel' })
    ).toHaveAttribute('data-error', 'guild.channels.create.error');

    fireEvent.change(screen.getByRole('textbox', { name: 'guild.channels.create.nameLabel' }), {
      target: { value: 'fixed' },
    });
    expect(
      screen.getByRole('textbox', { name: 'guild.channels.create.nameLabel' })
    ).toHaveAttribute('data-error', '');
  });

  it('does not create a channel when the trimmed name is empty', () => {
    render(
      <CreateChannelModal
        guildId="guild-1"
        nextPosition={1}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'guild.channels.create.nameLabel' }), {
      target: { value: '   ' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.channels.create.submit' }));

    expect(createChannel).not.toHaveBeenCalled();
  });
});
