import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    title: 'Modal title',
    closeLabel: 'Close',
    onClose: () => {},
    children: (
      <p className="text-sm text-text-2">
        Modal body content goes here. Add any form, text or section as children.
      </p>
    ),
  },
};

export const WithForm: Story = {
  args: {
    title: 'Create a channel',
    closeLabel: 'Cancel',
    onClose: () => {},
    children: (
      <form className="flex flex-col gap-5">
        <Input label="Channel name" placeholder="e.g. general" />
        <div className="flex justify-end gap-2">
          <Button variant="tertiary">Cancel</Button>
          <Button type="submit">Create</Button>
        </div>
      </form>
    ),
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Create or join a guild',
    subtitle: 'Create a new space or join a guild with an invite code.',
    closeLabel: 'Close',
    onClose: () => {},
    children: <p className="text-sm text-text-2">Body content goes here.</p>,
  },
};

export const WithMaxWidthLg: Story = {
  args: {
    title: 'Wide modal',
    closeLabel: 'Close',
    maxWidth: 'max-w-lg',
    onClose: () => {},
    children: <p className="text-sm text-text-2">This modal uses a larger max-width (max-w-lg).</p>,
  },
};

const InteractiveDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-center h-screen bg-surface-2">
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      {open && (
        <Modal title="Edit channel" closeLabel="Close" onClose={() => setOpen(false)}>
          <form className="flex flex-col gap-4">
            <Input label="Channel name" defaultValue="general" autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="tertiary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
