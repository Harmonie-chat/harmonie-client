import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Volume2, VolumeX } from 'lucide-react';
import { VoiceParticipantCard } from './VoiceParticipantCard';

const meta: Meta<typeof VoiceParticipantCard> = {
  title: 'Display/VoiceParticipantCard',
  component: VoiceParticipantCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof VoiceParticipantCard>;

const cardStyle = { width: '20rem', height: '15rem' };

export const WithInitials: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    titleClassName: 'text-2xl',
    style: {
      ...cardStyle,
      background: 'linear-gradient(145deg, hsl(120 42% 94%) 0%, hsl(148 38% 90%) 100%)',
    },
  },
};

export const WithImage: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    titleClassName: 'text-2xl',
    style: cardStyle,
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    avatarIcon: 'PawPrint',
    avatarColor: '#6B5F58',
    avatarBg: '#D4E4D7',
    titleClassName: 'text-2xl',
    style: cardStyle,
  },
};

export const Summary: Story = {
  args: {
    title: '3 participants',
    avatarLabel: '+3',
    avatarSize: 96,
    titleClassName: 'text-2xl',
    style: cardStyle,
  },
};

export const Speaking: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    titleClassName: 'text-2xl',
    isSpeaking: true,
    style: {
      ...cardStyle,
      background: 'linear-gradient(145deg, hsl(120 42% 94%) 0%, hsl(148 38% 90%) 100%)',
    },
  },
};

export const SpeakingWithIcon: Story = {
  args: {
    title: 'Nyx',
    avatarLabel: 'N',
    avatarSize: 96,
    avatarIcon: 'PawPrint',
    avatarColor: '#6B5F58',
    avatarBg: '#D4E4D7',
    titleClassName: 'text-2xl',
    isSpeaking: true,
    style: cardStyle,
  },
};

const VolumeSliderStory = () => {
  const [volume, setVolume] = useState(50);

  return (
    <div className="relative" style={cardStyle}>
      <VoiceParticipantCard
        title="Arastorn"
        avatarLabel="A"
        avatarSize={72}
        avatarIcon="Leaf"
        avatarColor="#7EB88A"
        avatarBg="#2F201F"
        titleClassName="text-sm"
        isSpeaking
        className="h-full w-full"
        style={{
          background: 'linear-gradient(145deg, hsl(318 28% 96%) 0%, hsl(286 24% 93%) 100%)',
        }}
      />
      <div className="absolute inset-x-6 bottom-6 flex items-center gap-2 rounded-full border border-border-2 bg-surface-1/95 px-3 py-2 shadow-[0_4px_16px_rgba(61,53,48,0.14)]">
        {volume === 0 ? (
          <VolumeX size={15} className="shrink-0 text-text-3" />
        ) : (
          <Volume2 size={15} className="shrink-0 text-text-3" />
        )}
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary/35 [&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-primary [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-none [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border-1/25 [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-3px] [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-none"
          style={
            {
              background: `linear-gradient(to right, var(--color-primary) 0 ${volume}%, rgb(from var(--color-border-1) r g b / 0.24) ${volume}% 100%)`,
            } as CSSProperties
          }
          aria-label="Arastorn's volume"
        />
        <span className="w-9 text-right text-xs tabular-nums text-text-2">{volume}%</span>
      </div>
    </div>
  );
};

export const WithVolumeSlider: Story = {
  render: () => <VolumeSliderStory />,
};
