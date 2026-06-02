import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './Separator';

const meta: Meta<typeof Separator> = {
  title: 'Display/Separator',
  component: Separator,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-6 w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: { label: 'ou' },
};

export const Accent: Story = {
  args: { label: 'New messages', variant: 'accent' },
};

export const AccentNoLabel: Story = {
  args: { variant: 'accent' },
};
