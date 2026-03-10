import type { Meta, StoryObj } from '@storybook/react';
import { Settings } from 'lucide-react';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    children: <Settings size={16} />,
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: { size: 'normal' },
};

export const Hover: Story = {
  args: { size: 'normal', className: 'bg-surface-3' },
};

export const Disabled: Story = {
  args: { size: 'normal', disabled: true },
};

export const Small: Story = {
  args: { size: 'small' },
};

export const SmallDisabled: Story = {
  args: { size: 'small', disabled: true },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-8">
        <span className="w-24 text-text-2 text-sm">Normal</span>
        <IconButton size="normal">
          <Settings size={16} />
        </IconButton>
        <IconButton size="normal" className="bg-surface-3">
          <Settings size={16} />
        </IconButton>
        <IconButton size="normal" disabled>
          <Settings size={16} />
        </IconButton>
      </div>
      <div className="flex items-center gap-8">
        <span className="w-24 text-text-2 text-sm">Small</span>
        <IconButton size="small">
          <Settings size={14} />
        </IconButton>
        <IconButton size="small" className="bg-surface-3">
          <Settings size={14} />
        </IconButton>
        <IconButton size="small" disabled>
          <Settings size={14} />
        </IconButton>
      </div>
    </div>
  ),
};
