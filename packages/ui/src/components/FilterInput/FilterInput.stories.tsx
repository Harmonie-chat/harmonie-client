import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hash, Search, User } from 'lucide-react';
import { Badge } from '../Badge/Badge';
import { FilterInput } from './FilterInput';

const meta: Meta<typeof FilterInput> = {
  title: 'Forms/FilterInput',
  component: FilterInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FilterInput>;

export const Empty: Story = {
  render: () => (
    <div className="w-64">
      <FilterInput rightElement={<Search size={13} />}>
        <input
          placeholder="Search messages"
          className="flex-1 min-w-0 bg-transparent outline-none font-body text-sm text-text-1 placeholder:text-text-3"
        />
      </FilterInput>
    </div>
  ),
};

export const WithChips: Story = {
  render: () => (
    <div className="w-72">
      <FilterInput rightElement={<Search size={13} />}>
        <Badge variant="filter" icon={<User size={10} />}>
          Laurine
        </Badge>
        <Badge variant="filter" icon={<Hash size={10} />}>
          general
        </Badge>
        <input
          defaultValue="release"
          className="flex-1 min-w-0 bg-transparent outline-none font-body text-sm text-text-1 placeholder:text-text-3"
        />
      </FilterInput>
    </div>
  ),
};
