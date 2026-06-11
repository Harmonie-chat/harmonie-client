import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VoiceParticipantCard } from './VoiceParticipantCard';

describe('VoiceParticipantCard', () => {
  it('renders avatar media and speaking state', () => {
    render(
      <VoiceParticipantCard
        title="Ada"
        avatarLabel="AL"
        avatarUrl="blob:avatar"
        isSpeaking
        data-testid="card"
      />
    );

    expect(screen.getByTestId('card')).toHaveClass('border-primary');
    expect(screen.getByRole('img', { name: 'Ada' })).toHaveAttribute('src', 'blob:avatar');
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('falls back to initials when no avatar is configured', () => {
    render(<VoiceParticipantCard title="Grace" avatarLabel="GH" avatarSize={80} />);

    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
  });

  it('renders icon avatars and custom classes outside speaking state', () => {
    render(
      <VoiceParticipantCard
        title="Lin"
        avatarLabel="LC"
        avatarIcon="User"
        avatarColor="#fff"
        avatarBg="#111"
        className="custom-card"
        titleClassName="custom-title"
        data-testid="voice-card"
      />
    );

    expect(screen.getByTestId('voice-card')).toHaveClass('border-border-2', 'custom-card');
    expect(screen.getByText('Lin')).toHaveClass('custom-title');
    expect(screen.queryByText('LC')).not.toBeInTheDocument();
  });
});
