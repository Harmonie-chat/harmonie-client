import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gavel, UserMinus } from 'lucide-react';
import { UserListItem } from './UserListItem';

interface StoryUser {
  id: string;
  name: string;
}

const user: StoryUser = {
  id: '1',
  name: 'Laurine',
};

const meta: Meta<typeof UserListItem<StoryUser>> = {
  title: 'Identity/UserListItem',
  component: UserListItem<StoryUser>,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'surface' },
  },
  args: {
    user,
    label: 'Laurine',
    avatarIcon: 'Cat',
    avatarColor: 'var(--color-cat-1-fg)',
    avatarBg: 'var(--color-cat-1)',
    onSelect: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-56 rounded-md bg-surface-1 py-2">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UserListItem<StoryUser>>;

export const Default: Story = {};

export const WithSubtitle: Story = {
  args: {
    subtitle: '@laurine',
  },
};

export const WithImage: Story = {
  args: {
    label: 'Nyx',
    subtitle: '@nyx',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
  },
};

export const WithContextMenu: Story = {
  args: {
    subtitle: 'Admin',
    contextItems: [
      {
        label: 'Kick member',
        icon: <UserMinus size={14} />,
        onClick: () => undefined,
      },
      {
        label: 'Ban member',
        icon: <Gavel size={14} />,
        onClick: () => undefined,
      },
    ],
  },
};
