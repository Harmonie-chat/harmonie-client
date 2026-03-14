import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Globe, LogOut, Palette, UserRound } from 'lucide-react';
import { ModalPanel } from './ModalPanel';
import { Button } from '../Button/Button';
import { NavList } from '../NavList/NavList';
import { Separator } from '../Separator/Separator';

const meta: Meta<typeof ModalPanel> = {
  title: 'Components/ModalPanel',
  component: ModalPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ModalPanel>;

const NAV_ITEMS = [
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'avatar', label: 'Avatar', icon: UserRound },
  { id: 'theme', label: 'Theme', icon: Palette },
];

const DemoSidebar = ({ active, onSelect }: { active: string; onSelect: (id: string) => void }) => (
  <>
    <p className="text-xs font-semibold text-text-3 uppercase tracking-wider px-3 pt-1 pb-2">
      Settings
    </p>
    <Separator />
    <NavList className="mt-2">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <NavList.Item
          key={id}
          icon={<Icon size={15} />}
          label={label}
          active={active === id}
          onClick={() => onSelect(id)}
        />
      ))}
    </NavList>
    <div className="mt-auto flex flex-col gap-1">
      <Separator />
      <NavList>
        <NavList.Item icon={<LogOut size={15} />} label="Log out" onClick={() => {}} />
      </NavList>
    </div>
  </>
);

export const Default: Story = {
  args: {
    title: 'Language',
    closeLabel: 'Close settings',
    onClose: () => {},
    sidebar: <DemoSidebar active="language" onSelect={() => {}} />,
    children: <p className="text-sm text-text-2">Section content goes here.</p>,
  },
};

const InteractiveDemo = () => {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('language');
  const activeItem = NAV_ITEMS.find((n) => n.id === section);

  return (
    <div className="flex items-center justify-center h-screen bg-surface-2">
      <Button onClick={() => setOpen(true)}>Open settings</Button>
      {open && (
        <ModalPanel
          title={activeItem?.label ?? ''}
          closeLabel="Close settings"
          onClose={() => setOpen(false)}
          sidebar={<DemoSidebar active={section} onSelect={setSection} />}
        >
          <p className="text-sm text-text-2">
            Content for <strong>{activeItem?.label}</strong> section.
          </p>
        </ModalPanel>
      )}
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
