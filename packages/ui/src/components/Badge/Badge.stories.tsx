import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hash, User } from 'lucide-react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Display/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'owner', 'filter'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'member',
    variant: 'default',
  },
};

export const Owner: Story = {
  args: {
    children: 'owner',
    variant: 'owner',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Badge variant="default">member</Badge>
      <Badge variant="owner">owner</Badge>
      <Badge variant="filter" icon={<Hash size={10} />}>
        general
      </Badge>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: 'Laurine',
    icon: <User size={10} />,
    variant: 'default',
  },
};

export const Removable: Story = {
  args: {
    children: 'general',
    icon: <Hash size={10} />,
    variant: 'filter',
    onRemove: () => undefined,
  },
};
