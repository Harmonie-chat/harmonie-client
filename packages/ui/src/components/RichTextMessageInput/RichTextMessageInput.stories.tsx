import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextMessageInput } from './RichTextMessageInput';

const meta: Meta<typeof RichTextMessageInput> = {
  title: 'TextMessage/RichTextMessageInput',
  component: RichTextMessageInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[44rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RichTextMessageInput>;

const InteractiveTemplate = (args: React.ComponentProps<typeof RichTextMessageInput>) => {
  const [value, setValue] = useState(args.value ?? '');
  const [formattingOpen, setFormattingOpen] = useState(args.showFormattingTools ?? false);

  return (
    <RichTextMessageInput
      {...args}
      value={value}
      onChange={setValue}
      showFormattingTools={formattingOpen}
      onToggleFormattingTools={() => setFormattingOpen((current) => !current)}
    />
  );
};

export const Default: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    value: '',
    placeholder: 'Write a message...',
  },
};

export const WithFormattingOpen: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    value: '<p><strong>Hello</strong> <em>team</em></p>',
    placeholder: 'Write a message...',
    showFormattingTools: true,
  },
};

export const WithLists: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    value:
      '<h1>Changelog -- Soon</h1><ul><li>Reload visual messages only</li><li>Message cache between conversations</li><li>Notification title improvements</li></ul>',
    placeholder: 'Write a message...',
    showFormattingTools: true,
  },
};

export const WithError: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    value: '',
    placeholder: 'Write a message...',
    error: 'Message is too long.',
  },
};

export const Disabled: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    value: '<p>Sending message...</p>',
    placeholder: 'Write a message...',
    disabled: true,
  },
};

export const WithSubmitAction: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    value: '',
    placeholder: 'Write a message...',
    onSubmit: () => undefined,
    submitDisabled: false,
    onAttachClick: () => undefined,
  },
};
