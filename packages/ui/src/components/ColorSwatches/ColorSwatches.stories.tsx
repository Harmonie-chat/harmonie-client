import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorSwatches } from './ColorSwatches';

const PRESET_COLORS = ['#8AAD90', '#9B8FB0', '#C4876A', '#C4B06A', '#C47A8A'];

const meta: Meta<typeof ColorSwatches> = {
  title: 'Components/ColorSwatches',
  component: ColorSwatches,
  tags: ['autodocs'],
  args: {
    colors: PRESET_COLORS,
    selected: PRESET_COLORS[0],
    onSelect: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ColorSwatches>;

export const Default: Story = {};

export const NoneSelected: Story = {
  args: { selected: '' },
};

export const WithCustomPicker: Story = {
  args: { showCustomPicker: true },
};

const InteractiveExample = () => {
  const [selected, setSelected] = useState(PRESET_COLORS[0] ?? '');
  return <ColorSwatches colors={PRESET_COLORS} selected={selected} onSelect={setSelected} />;
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};

const InteractiveWithCustom = () => {
  const [selected, setSelected] = useState(PRESET_COLORS[0] ?? '');
  return (
    <ColorSwatches
      colors={PRESET_COLORS}
      selected={selected}
      onSelect={setSelected}
      showCustomPicker
    />
  );
};

export const InteractiveWithCustomPicker: Story = {
  render: () => <InteractiveWithCustom />,
};
