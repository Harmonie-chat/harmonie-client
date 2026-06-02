import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../Avatar/Avatar';
import { AvatarGroup } from './AvatarGroup';

const meta: Meta<typeof AvatarGroup> = {
  title: 'Identity/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

export const TwoImages: Story = {
  render: () => (
    <AvatarGroup size={24}>
      <Avatar avatarUrl="https://i.pravatar.cc/150?img=3" alt="Alice" size={16} />
      <Avatar avatarUrl="https://i.pravatar.cc/150?img=5" alt="Bob" size={16} />
    </AvatarGroup>
  ),
};

export const TwoFallbacks: Story = {
  render: () => (
    <AvatarGroup size={24}>
      <Avatar fallback="Alice" size={16} />
      <Avatar fallback="Bob" size={16} />
    </AvatarGroup>
  ),
};

export const SingleAvatar: Story = {
  render: () => (
    <AvatarGroup size={24}>
      <Avatar fallback="Alice" size={16} />
    </AvatarGroup>
  ),
};

export const Mixed: Story = {
  render: () => (
    <AvatarGroup size={24}>
      <Avatar avatarUrl="https://i.pravatar.cc/150?img=3" alt="Alice" size={16} />
      <Avatar fallback="Bob" size={16} />
    </AvatarGroup>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <span className="w-40 text-text-2 text-sm">Two images</span>
        <AvatarGroup size={24}>
          <Avatar avatarUrl="https://i.pravatar.cc/150?img=3" alt="Alice" size={16} />
          <Avatar avatarUrl="https://i.pravatar.cc/150?img=5" alt="Bob" size={16} />
        </AvatarGroup>
      </div>
      <div className="flex items-center gap-4">
        <span className="w-40 text-text-2 text-sm">Two fallbacks</span>
        <AvatarGroup size={24}>
          <Avatar fallback="Alice" size={16} />
          <Avatar fallback="Bob" size={16} />
        </AvatarGroup>
      </div>
      <div className="flex items-center gap-4">
        <span className="w-40 text-text-2 text-sm">Single avatar</span>
        <AvatarGroup size={24}>
          <Avatar fallback="Alice" size={16} />
        </AvatarGroup>
      </div>
    </div>
  ),
};
