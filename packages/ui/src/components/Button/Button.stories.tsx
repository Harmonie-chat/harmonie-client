import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Button',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Tertiary: Story = {
  args: { variant: 'tertiary' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true },
};

export const Loading: Story = {
  args: { variant: 'primary', isLoading: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-8">
        <span className="w-24 text-text-2 text-sm">Primary</span>
        <Button variant="primary">Button</Button>
        <Button variant="primary" disabled>
          Button
        </Button>
        <Button variant="primary" isLoading>
          Button
        </Button>
      </div>
      <div className="flex items-center gap-8">
        <span className="w-24 text-text-2 text-sm">Secondary</span>
        <Button variant="secondary">Button</Button>
        <Button variant="secondary" disabled>
          Button
        </Button>
        <Button variant="secondary" isLoading>
          Button
        </Button>
      </div>
      <div className="flex items-center gap-8">
        <span className="w-24 text-text-2 text-sm">Tertiary</span>
        <Button variant="tertiary">Button</Button>
        <Button variant="tertiary" disabled>
          Button
        </Button>
        <Button variant="tertiary" isLoading>
          Button
        </Button>
      </div>
    </div>
  ),
};
