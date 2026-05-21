import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Smile } from 'lucide-react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Forms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    rows: 4,
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Error: Story = {
  args: { defaultValue: 'Some text', error: 'Error message' },
};

export const WithDefaultValue: Story = {
  args: { defaultValue: 'This is some pre-filled content.' },
};

export const WithBottomRightElement: Story = {
  args: {
    bottomRightElement: <Smile size={16} className="text-text-3" />,
  },
};

const MAX = 500;

const TextareaWithCounter = () => {
  const [value, setValue] = useState('');
  const remaining = MAX - value.length;

  return (
    <div className="flex flex-col gap-1.5 max-w-sm">
      <Textarea
        label="Label"
        placeholder="Placeholder"
        rows={4}
        value={value}
        maxLength={MAX}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex justify-end">
        <span
          className={[
            'text-xs tabular-nums',
            remaining < 50 ? 'text-error-fg' : 'text-text-3',
          ].join(' ')}
        >
          {remaining}
        </span>
      </div>
    </div>
  );
};

/** Interactive story showing a character counter paired with the Textarea. */
export const WithCharCounter: Story = {
  render: () => <TextareaWithCounter />,
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-6 max-w-sm">
      <div className="flex items-start gap-8">
        <span className="w-20 text-text-2 text-sm pt-8">Default</span>
        <div className="flex-1">
          <Textarea label="Label" placeholder="Placeholder" rows={3} />
        </div>
      </div>
      <div className="flex items-start gap-8">
        <span className="w-20 text-text-2 text-sm pt-8">Disabled</span>
        <div className="flex-1">
          <Textarea label="Label" placeholder="Placeholder" rows={3} disabled />
        </div>
      </div>
      <div className="flex items-start gap-8">
        <span className="w-20 text-text-2 text-sm pt-8">Error</span>
        <div className="flex-1">
          <Textarea label="Label" defaultValue="Some text" rows={3} error="Error message" />
        </div>
      </div>
      <div className="flex items-start gap-8">
        <span className="w-20 text-text-2 text-sm pt-8">Action</span>
        <div className="flex-1">
          <Textarea
            label="Label"
            placeholder="Placeholder"
            rows={3}
            bottomRightElement={<Smile size={16} className="text-text-3" />}
          />
        </div>
      </div>
    </div>
  ),
};
