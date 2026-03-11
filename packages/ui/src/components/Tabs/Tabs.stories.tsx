import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: {
    tabs: [
      { id: 'first', label: 'First' },
      { id: 'second', label: 'Second' },
      { id: 'third', label: 'Third' },
    ],
    activeTab: 'first',
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};

export const SecondActive: Story = {
  args: { activeTab: 'second' },
};

const InteractiveExample = () => {
  const tabs = [
    { id: 'icon', label: 'Icon' },
    { id: 'image', label: 'Image' },
  ];
  const [active, setActive] = useState('icon');
  return <Tabs tabs={tabs} activeTab={active} onChange={setActive} />;
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};
