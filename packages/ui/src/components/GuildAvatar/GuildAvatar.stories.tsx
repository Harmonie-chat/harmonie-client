import type { Meta, StoryObj } from '@storybook/react-vite';
import { GuildAvatar } from './GuildAvatar';

const meta: Meta<typeof GuildAvatar> = {
  title: 'Identity/GuildAvatar',
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

export const WithIconLarge: Story = {
  args: {
    icon: 'Crown',
    color: '#FFFFFF',
    bg: '#8AAD90',
    size: 56,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Image (40px)</span>
        <GuildAvatar iconUrl="https://i.pravatar.cc/150?img=12" alt="Guild" size={40} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Image (56px)</span>
        <GuildAvatar iconUrl="https://i.pravatar.cc/150?img=15" alt="Guild" size={56} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Icon (40px)</span>
        <GuildAvatar icon="Crown" color="#FFFFFF" bg="#8AAD90" size={40} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-text-2 text-sm">Icon (56px)</span>
        <GuildAvatar icon="Music4" color="#FFFFFF" bg="#8891B5" size={56} />
      </div>
    </div>
  ),
};
