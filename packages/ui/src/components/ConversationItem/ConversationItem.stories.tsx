import type { Meta, StoryObj } from '@storybook/react-vite';
import { Users } from 'lucide-react';
import { ConversationItem } from './ConversationItem';

const DmAvatar = ({ name }: { name: string }) => (
  <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-xs font-semibold text-text-2 shrink-0">
    {name[0]?.toUpperCase()}
  </div>
);

const GroupAvatar = () => (
  <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-text-3 shrink-0">
    <Users size={12} />
  </div>
);

const meta: Meta<typeof ConversationItem> = {
  title: 'Navigation/ConversationItem',
  component: ConversationItem,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'surface' },
  },
};

export default meta;
type Story = StoryObj<typeof ConversationItem>;

export const Default: Story = {
  args: {
    avatar: <DmAvatar name="Nyx" />,
    label: 'Nyx',
    active: false,
    unread: false,
    onClick: () => {},
  },
};

export const Active: Story = {
  args: {
    avatar: <DmAvatar name="Nyx" />,
    label: 'Nyx',
    active: true,
    unread: false,
    onClick: () => {},
  },
};

export const Unread: Story = {
  args: {
    avatar: <DmAvatar name="Alice" />,
    label: 'Alice',
    active: false,
    unread: true,
    onClick: () => {},
  },
};

export const Group: Story = {
  args: {
    avatar: <GroupAvatar />,
    label: 'Alice, Bob, Charlie',
    active: false,
    unread: false,
    onClick: () => {},
  },
};

export const GroupUnread: Story = {
  args: {
    avatar: <GroupAvatar />,
    label: 'Alice, Bob, Charlie',
    active: false,
    unread: true,
    onClick: () => {},
  },
};

export const ActiveCall: Story = {
  args: {
    avatar: <DmAvatar name="Nyx" />,
    label: 'Nyx',
    active: false,
    unread: false,
    callActive: true,
    callLabel: 'Call in progress',
    onClick: () => {},
  },
};

export const WithDelete: Story = {
  args: {
    avatar: <DmAvatar name="Nyx" />,
    label: 'Nyx',
    active: false,
    unread: false,
    onClick: () => {},
    onDeleteClick: () => {},
    deleteLabel: 'Leave conversation',
  },
};
