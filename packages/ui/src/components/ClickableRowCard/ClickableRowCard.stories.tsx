import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ClickableRowCard } from './ClickableRowCard';

const meta: Meta<typeof ClickableRowCard> = {
  title: 'Layout/ClickableRowCard',
  component: ClickableRowCard,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ClickableRowCard>;

const InteractiveExample = () => {
  const [count, setCount] = useState(0);

  return (
    <ClickableRowCard onClick={() => setCount((current) => current + 1)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-text-1">Selected {count} time(s)</span>
        <span className="text-xs text-text-3">Enter, Space, or click</span>
      </div>
    </ClickableRowCard>
  );
};

export const Default: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-text-1">Pinned message</span>
        <span className="text-sm text-text-2">
          A compact clickable row with hover and focus states.
        </span>
      </div>
    ),
    onClick: () => {},
  },
};

export const WithTrailingContent: Story = {
  args: {
    children: (
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-text-1">Message preview</span>
          <span className="text-sm text-text-2">A row can host richer content.</span>
        </div>
        <span className="text-xs text-primary">Pinned</span>
      </div>
    ),
    onClick: () => {},
  },
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};
