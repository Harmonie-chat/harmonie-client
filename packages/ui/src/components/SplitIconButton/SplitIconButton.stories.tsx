import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronUp, HeadphoneOff, Headphones } from 'lucide-react';
import { SplitIconButton } from './SplitIconButton';

const meta: Meta<typeof SplitIconButton> = {
  title: 'Actions/SplitIconButton',
  component: SplitIconButton,
  tags: ['autodocs'],
  args: {
    size: 'small',
    selected: false,
    open: false,
    primaryLabel: 'Mute audio output',
    secondaryLabel: 'Select audio output device',
    primaryIcon: <Headphones size={16} />,
    secondaryIcon: <ChevronUp size={10} className="rotate-180" />,
  },
};

export default meta;

type Story = StoryObj<typeof SplitIconButton>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selected: true,
    primaryIcon: <HeadphoneOff size={16} />,
  },
};

export const Open: Story = {
  args: {
    open: true,
    secondaryIcon: <ChevronUp size={10} />,
  },
};
