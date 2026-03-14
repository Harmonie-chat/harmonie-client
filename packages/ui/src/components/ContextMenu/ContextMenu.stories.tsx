import type { Meta, StoryObj } from '@storybook/react';
import { Pencil, Trash2 } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

const meta: Meta<typeof ContextMenu> = {
  title: 'Components/ContextMenu',
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
