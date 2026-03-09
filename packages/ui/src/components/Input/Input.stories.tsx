import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Error: Story = {
  args: { defaultValue: 'Value', error: 'Error' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-6 max-w-sm">
      <div className="flex items-start gap-8">
        <span className="w-20 text-text-2 text-sm pt-8">Default</span>
        <div className="flex-1">
          <Input label="Label" placeholder="Placeholder" />
        </div>
      </div>
      <div className="flex items-start gap-8">
        <span className="w-20 text-text-2 text-sm pt-8">Disabled</span>
        <div className="flex-1">
          <Input label="Label" placeholder="Placeholder" disabled />
        </div>
      </div>
      <div className="flex items-start gap-8">
        <span className="w-20 text-text-2 text-sm pt-8">Error</span>
        <div className="flex-1">
          <Input label="Label" defaultValue="Value" error="Error" />
        </div>
      </div>
    </div>
  ),
};
