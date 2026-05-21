import type { Meta, StoryObj } from '@storybook/react';
import { EmojiPickerBase } from './EmojiPickerBase';

const meta = {
  title: 'Forms/EmojiPickerBase',
  component: EmojiPickerBase,
  tags: ['autodocs'],
} satisfies Meta<typeof EmojiPickerBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onEmojiClick: (data) => console.log('emoji clicked:', data.emoji),
  },
};

export const Compact: Story = {
  args: {
    onEmojiClick: (data) => console.log('emoji clicked:', data.emoji),
    width: 280,
    height: 320,
  },
};
