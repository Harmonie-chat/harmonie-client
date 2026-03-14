import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EmojiInput } from './EmojiInput';

const meta: Meta<typeof EmojiInput> = {
  title: 'Components/EmojiInput',
  component: EmojiInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmojiInput>;

// Interactive story with controlled state
const InteractiveTemplate = (args: React.ComponentProps<typeof EmojiInput>) => {
  const [value, setValue] = useState(args.value ?? '');
  return <EmojiInput {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'Channel name',
    placeholder: 'e.g. general',
    value: '',
  },
};

export const WithLabel: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'Channel name',
    placeholder: 'e.g. announcements',
    value: '',
  },
};

export const Prefilled: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'Channel name',
    value: '🌿 garden',
  },
};

export const WithError: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'Channel name',
    placeholder: 'e.g. general',
    value: '',
    error: 'Unable to save channel. Please try again.',
  },
};

export const CustomButtonLabel: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    label: 'Channel name',
    placeholder: 'e.g. general',
    value: '',
    emojiButtonLabel: 'Choisir un emoji',
  },
};
