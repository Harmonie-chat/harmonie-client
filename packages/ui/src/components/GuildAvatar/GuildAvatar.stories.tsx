import type { Meta, StoryObj } from '@storybook/react';
import { GuildAvatar } from './GuildAvatar';

const meta: Meta<typeof GuildAvatar> = {
  title: 'Components/GuildAvatar',
  component: GuildAvatar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GuildAvatar>;

export const WithImage: Story = {
  args: {
    iconUrl: 'https://i.pravatar.cc/150?img=12',
    alt: 'Guild avatar',
    size: 40,
  },
};

export const WithIcon: Story = {
  args: {
    icon: 'Crown',
    color: '#FFFFFF',
    bg: '#8AAD90',
    size: 40,
  },
};
