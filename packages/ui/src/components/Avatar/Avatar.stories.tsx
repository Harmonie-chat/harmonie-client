import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    alt: 'User avatar',
    size: 32,
  },
};

export const WithIcon: Story = {
  args: {
    icon: 'User',
    color: '#FFFFFF',
    bg: '#8AAD90',
    size: 32,
  },
};

export const WithIconLarge: Story = {
  args: {
    icon: 'User',
    color: '#FFFFFF',
    bg: '#8AAD90',
    size: 48,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Image (32px)</span>
        <Avatar avatarUrl="https://i.pravatar.cc/150?img=3" alt="User" size={32} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Image (48px)</span>
        <Avatar avatarUrl="https://i.pravatar.cc/150?img=5" alt="User" size={48} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Icon – User</span>
        <Avatar icon="User" color="#FFFFFF" bg="#8AAD90" size={32} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Icon – Bot</span>
        <Avatar icon="Bot" color="#FFFFFF" bg="#8891B5" size={32} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Icon – Music</span>
        <Avatar icon="Music" color="#FFFFFF" bg="#C8A68A" size={32} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Icon – Smile</span>
        <Avatar icon="Smile" color="#3D3530" bg="#F5D9A0" size={32} />
      </div>
    </div>
  ),
};
