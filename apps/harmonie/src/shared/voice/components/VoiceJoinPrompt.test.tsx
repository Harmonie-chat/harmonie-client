import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VoiceJoinPrompt } from './VoiceJoinPrompt';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VoiceJoinPrompt', () => {
  it('renders the ready state and joins on click', async () => {
    const onJoin = vi.fn();

    render(
      <VoiceJoinPrompt channelName="General" isJoining={false} joinError={null} onJoin={onJoin} />
    );

    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByText('voice.readyToJoin')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'voice.join' }));

    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  it('renders joining progress instead of the join action', () => {
    render(<VoiceJoinPrompt channelName="Stage" isJoining joinError={null} onJoin={vi.fn()} />);

    expect(screen.getByText('voice.joining')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'voice.join' })).not.toBeInTheDocument();
  });

  it('translates the join error key when present', () => {
    render(
      <VoiceJoinPrompt
        channelName="Support"
        isJoining={false}
        joinError="voice.microphoneDenied"
        onJoin={vi.fn()}
      />
    );

    expect(screen.getByText('voice.microphoneDenied')).toBeInTheDocument();
  });
});
