import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RichTextMentionAutocomplete } from './RichTextMentionAutocomplete';

const meta = {
  title: 'TextMessage/RichTextMentionAutocomplete',
  component: RichTextMentionAutocomplete,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof RichTextMentionAutocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

const results = [
  { userId: '1', username: 'ada', displayName: 'Ada Lovelace' },
  { userId: '2', username: 'grace', displayName: 'Grace Hopper' },
  { userId: '3', username: 'linus', displayName: null },
];

const KeyboardSelectionExample = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div
      className="min-h-screen bg-surface-2"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          setSelectedIndex((current) => (current + 1) % results.length);
        }
        if (event.key === 'ArrowUp') {
          setSelectedIndex((current) => (current - 1 + results.length) % results.length);
        }
      }}
    >
      <RichTextMentionAutocomplete
        results={results}
        selectedIndex={selectedIndex}
        pos={{ bottom: 24, left: 24, width: 320 }}
        onSelect={(result) => setSelectedIndex(results.findIndex((item) => item === result))}
        containerRef={{ current: null }}
      />
    </div>
  );
};

export const Default: Story = {
  args: {
    results,
    selectedIndex: 0,
    pos: { bottom: 24, left: 24, width: 320 },
    onSelect: () => {},
    containerRef: { current: null },
  },
};

export const KeyboardSelection: Story = {
  render: () => <KeyboardSelectionExample />,
};
