import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShieldBan, UserMinus } from 'lucide-react';
import { UserPopover } from './UserPopover';

const anchorRect = new DOMRect(320, 160, 32, 32);

const meta: Meta<typeof UserPopover> = {
  title: 'Identity/UserPopover',
  component: UserPopover,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'surface' },
  },
  args: {
    anchorRect,
    onClose: () => undefined,
    label: 'Laurine',
    username: 'laurine',
    avatarIcon: 'Cat',
    avatarColor: 'var(--color-cat-1-fg)',
    avatarBg: 'var(--color-cat-1)',
    headerBackground: 'linear-gradient(135deg, #8AAD90, #8891B5)',
    side: 'right',
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-[420px] bg-surface-2">
        <div
          className="fixed w-8 h-8 rounded-full bg-primary"
          style={{ left: anchorRect.left, top: anchorRect.top }}
        />
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UserPopover>;

export const Default: Story = {};

export const WithBadges: Story = {
  args: {
    badges: [{ label: 'Member' }, { label: 'Owner', variant: 'owner' }],
  },
};

export const WithBio: Story = {
  args: {
    badges: [{ label: 'Member' }],
    bioLabel: 'Bio',
    bio: 'Builds tiny interfaces with suspiciously strong opinions about spacing.',
  },
};

export const WithActions: Story = {
  args: {
    badges: [{ label: 'Admin' }],
    actions: [
      {
        label: 'Kick member',
        icon: <UserMinus size={13} />,
        onClick: () => undefined,
      },
      {
        label: 'Ban member',
        icon: <ShieldBan size={13} />,
        onClick: () => undefined,
      },
    ],
  },
};

export const LeftAnchored: Story = {
  args: {
    side: 'left',
    anchorRect: new DOMRect(480, 160, 32, 32),
  },
};
