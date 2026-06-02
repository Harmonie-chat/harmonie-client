import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl } from './SegmentedControl';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Navigation/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  args: {
    options: [
      { value: 'create', label: 'Create' },
      { value: 'join', label: 'Join' },
    ],
    value: 'create',
    onChange: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export const ThreeOptions: Story = {
  args: {
    options: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
    ],
    value: 'week',
    onChange: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

const InteractiveDemo = () => {
  const [value, setValue] = useState<'create' | 'join'>('create');
  return (
    <div className="w-72 flex flex-col gap-4">
      <SegmentedControl
        options={[
          { value: 'create', label: 'Create' },
          { value: 'join', label: 'Join' },
        ]}
        value={value}
        onChange={setValue}
      />
      <p className="text-sm text-text-2 text-center">Selected: {value}</p>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
