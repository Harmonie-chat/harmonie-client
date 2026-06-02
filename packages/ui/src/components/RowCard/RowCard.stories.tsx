import type { Meta, StoryObj } from '@storybook/react-vite';
import { RowCard } from './RowCard';

const meta: Meta<typeof RowCard> = {
  title: 'Layout/RowCard',
  component: RowCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ul className="flex flex-col gap-2 w-96">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RowCard>;

export const Simple: Story = {
  args: {
    children: <span className="text-sm text-text-1">Simple text content</span>,
  },
};

export const WithActions: Story = {
  render: () => (
    <RowCard>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-1 truncate">Alice Dupont</p>
        <p className="text-xs text-text-3 truncate">@alice</p>
      </div>
      <button className="px-3 py-1.5 text-xs rounded-sm bg-surface-1 text-text-2">Action</button>
    </RowCard>
  ),
};

export const MultiRow: Story = {
  render: () => (
    <RowCard className="flex-col gap-2 items-stretch">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-1 truncate">Alice Dupont</p>
        </div>
        <button className="px-3 py-1.5 text-xs rounded-sm bg-surface-1 text-text-2">Cancel</button>
        <button className="px-3 py-1.5 text-xs rounded-sm bg-primary text-primary-fg">
          Confirm
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 px-3 py-2 text-sm rounded-sm bg-surface-1 border border-border-2 text-text-1"
          placeholder="Optional reason…"
        />
      </div>
    </RowCard>
  ),
};

export const List: Story = {
  render: () => (
    <>
      {['Alice', 'Bob', 'Carol'].map((name) => (
        <RowCard key={name}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-1">{name}</p>
          </div>
          <span className="text-xs text-text-3">Member</span>
        </RowCard>
      ))}
    </>
  ),
};
