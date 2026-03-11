import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioCard } from './RadioCard';

const meta: Meta<typeof RadioCard> = {
  title: 'Components/RadioCard',
  component: RadioCard,
  tags: ['autodocs'],
  args: {
    name: 'example',
    value: 'option',
    children: 'Option label',
  },
};

export default meta;
type Story = StoryObj<typeof RadioCard>;

export const Checked: Story = {
  args: { checked: true },
};

export const Unchecked: Story = {
  args: { checked: false },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true },
};

const LANG_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

const InteractiveExample = () => {
  const [selected, setSelected] = useState('fr');
  return (
    <div className="flex flex-col gap-2 w-64">
      {LANG_OPTIONS.map((opt) => (
        <RadioCard
          key={opt.value}
          name="lang"
          value={opt.value}
          checked={selected === opt.value}
          onChange={setSelected}
        >
          {opt.label}
        </RadioCard>
      ))}
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <RadioCard name="s" value="a" checked={false} onChange={() => {}}>
        Unchecked
      </RadioCard>
      <RadioCard name="s" value="b" checked onChange={() => {}}>
        Checked
      </RadioCard>
      <RadioCard name="s" value="c" checked disabled>
        Checked & disabled
      </RadioCard>
    </div>
  ),
};
