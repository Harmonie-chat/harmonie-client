import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hash, User } from 'lucide-react';
import { Combobox } from './Combobox';

const FILTER_ITEMS = [
  {
    value: 'members',
    label: 'Filter by author',
    description: 'Limit the search to one member',
    icon: <User size={16} />,
  },
  {
    value: 'channels',
    label: 'Filter by channel',
    description: 'Limit the search to one text channel',
    icon: <Hash size={16} />,
  },
];

const MEMBER_ITEMS = [
  { value: '1', label: 'Laurine', icon: <User size={14} /> },
  { value: '2', label: 'Harmonie Bot', icon: <User size={14} /> },
  { value: '3', label: 'Design Team', icon: <User size={14} /> },
];

const meta: Meta<typeof Combobox> = {
  title: 'Forms/Combobox',
  component: Combobox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Combobox>;

export const Menu: Story = {
  render: () => (
    <div className="relative h-56 w-80 p-6 bg-background">
      <Combobox
        items={FILTER_ITEMS}
        header="Filters"
        onSelect={() => undefined}
        className="min-w-64"
      />
    </div>
  ),
};

export const Searchable: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [query, setQuery] = useState('');
    const items = MEMBER_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <div className="relative h-72 w-80 p-6 bg-background">
        <Combobox
          items={items}
          onSelect={() => undefined}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search members"
          emptyMessage="No results"
          className="min-w-64 max-h-56 flex flex-col"
          autoFocusSearch
        />
      </div>
    );
  },
};
