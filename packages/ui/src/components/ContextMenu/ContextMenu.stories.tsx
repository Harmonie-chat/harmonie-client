import type { Meta, StoryObj } from '@storybook/react-vite';
import { Volume2, Pencil, Trash2 } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

const meta: Meta<typeof ContextMenu> = {
  title: 'Overlays/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  args: {
    position: { x: 0, y: 0 },
    onClose: () => {},
    items: [
      {
        label: 'Edit channel',
        icon: <Pencil size={14} />,
        onClick: () => {},
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="relative h-32 w-64">
        <Story />
      </div>
    ),
  ],
};

export const WithMultipleItems: Story = {
  args: {
    position: { x: 0, y: 0 },
    onClose: () => {},
    items: [
      {
        label: 'Edit channel',
        icon: <Pencil size={14} />,
        onClick: () => {},
      },
      {
        label: 'Delete channel',
        icon: <Trash2 size={14} />,
        disabled: true,
        onClick: () => {},
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="relative h-32 w-64">
        <Story />
      </div>
    ),
  ],
};

export const WithoutIcons: Story = {
  args: {
    position: { x: 0, y: 0 },
    onClose: () => {},
    items: [
      { label: 'Edit channel', onClick: () => {} },
      { label: 'Copy link', onClick: () => {} },
    ],
  },
  decorators: [
    (Story) => (
      <div className="relative h-32 w-64">
        <Story />
      </div>
    ),
  ],
};

export const RightAnchored: Story = {
  args: {
    position: { x: 240, y: 0 },
    horizontalAnchor: 'right',
    onClose: () => {},
    items: [
      { label: 'Rename guild', icon: <Pencil size={14} />, onClick: () => {} },
      { label: 'Delete guild', icon: <Trash2 size={14} />, onClick: () => {} },
    ],
  },
  decorators: [
    (Story) => (
      <div className="relative h-32 w-64">
        <Story />
      </div>
    ),
  ],
};

export const WithCustomContent: Story = {
  args: {
    position: { x: 0, y: 0 },
    onClose: () => {},
    items: [
      {
        label: 'User volume',
        content: (
          <div className="flex w-44 flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-xs font-medium text-text-2">User volume</span>
              <span className="shrink-0 text-xs tabular-nums text-text-3">75%</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="shrink-0 text-text-3" />
              <input
                type="range"
                min={0}
                max={100}
                defaultValue={75}
                aria-label="User volume"
                className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-border-1/25 accent-primary"
              />
            </div>
          </div>
        ),
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="relative h-36 w-72">
        <Story />
      </div>
    ),
  ],
};
