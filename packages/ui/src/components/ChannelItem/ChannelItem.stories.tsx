import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ChannelItem } from './ChannelItem';

const meta: Meta<typeof ChannelItem> = {
  title: 'Navigation/ChannelItem',
  component: ChannelItem,
  tags: ['autodocs'],
  args: {
    label: 'general',
    onClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ChannelItem>;

export const TextDefault: Story = {
  args: { type: 'text' },
};

export const TextActive: Story = {
  args: { type: 'text', active: true },
};

export const VoiceDefault: Story = {
  args: { type: 'voice' },
};

export const VoiceActive: Story = {
  args: { type: 'voice', active: true },
};

export const VoiceConnected: Story = {
  args: { type: 'voice', voiceActive: true },
};

export const VoiceConnectedAndActive: Story = {
  args: { type: 'voice', active: true, voiceActive: true },
};

const CHANNELS: { id: string; type: 'text' | 'voice'; label: string }[] = [
  { id: '1', type: 'text', label: 'general' },
  { id: '2', type: 'text', label: 'announcements' },
  { id: '3', type: 'voice', label: 'lounge' },
  { id: '4', type: 'voice', label: 'gaming' },
];

const InteractiveExample = () => {
  const [active, setActive] = useState('1');
  return (
    <div className="w-52 bg-surface-1 p-2 rounded-md flex flex-col gap-0.5">
      {CHANNELS.map(({ id, type, label }) => (
        <ChannelItem
          key={id}
          type={type}
          label={label}
          active={active === id}
          onClick={() => setActive(id)}
        />
      ))}
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};
