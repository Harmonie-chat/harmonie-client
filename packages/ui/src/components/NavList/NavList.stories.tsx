import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Globe, LogOut, Palette, UserRound } from 'lucide-react';
import { NavList } from './NavList';

const meta: Meta<typeof NavList> = {
  title: 'Components/NavList',
  component: NavList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NavList>;

export const Default: Story = {
  render: () => (
    <div className="w-48 bg-surface-2 p-3 rounded-md">
      <NavList>
        <NavList.Item icon={<Globe size={15} />} label="Language" onClick={() => {}} />
        <NavList.Item icon={<UserRound size={15} />} label="Avatar" onClick={() => {}} />
        <NavList.Item icon={<Palette size={15} />} label="Theme" onClick={() => {}} />
      </NavList>
    </div>
  ),
};

export const WithActiveItem: Story = {
  render: () => (
    <div className="w-48 bg-surface-2 p-3 rounded-md">
      <NavList>
        <NavList.Item icon={<Globe size={15} />} label="Language" active onClick={() => {}} />
        <NavList.Item icon={<UserRound size={15} />} label="Avatar" onClick={() => {}} />
        <NavList.Item icon={<Palette size={15} />} label="Theme" onClick={() => {}} />
      </NavList>
    </div>
  ),
};

const ITEMS = [
  { id: 'language', icon: Globe, label: 'Language' },
  { id: 'avatar', icon: UserRound, label: 'Avatar' },
  { id: 'theme', icon: Palette, label: 'Theme' },
];

const InteractiveExample = () => {
  const [active, setActive] = useState('language');
  return (
    <div className="w-48 bg-surface-2 p-3 rounded-md flex flex-col gap-2">
      <NavList>
        {ITEMS.map(({ id, icon: Icon, label }) => (
          <NavList.Item
            key={id}
            icon={<Icon size={15} />}
            label={label}
            active={active === id}
            onClick={() => setActive(id)}
          />
        ))}
      </NavList>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};

export const WithFooterAction: Story = {
  render: () => (
    <div className="w-48 bg-surface-2 p-3 rounded-md flex flex-col gap-2">
      <NavList>
        <NavList.Item icon={<Globe size={15} />} label="Language" active onClick={() => {}} />
        <NavList.Item icon={<UserRound size={15} />} label="Avatar" onClick={() => {}} />
        <NavList.Item icon={<Palette size={15} />} label="Theme" onClick={() => {}} />
      </NavList>
      <NavList>
        <NavList.Item icon={<LogOut size={15} />} label="Log out" onClick={() => {}} />
      </NavList>
    </div>
  ),
};
