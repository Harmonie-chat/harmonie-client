import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { Lightbox } from './Lightbox';
import { Button } from '../Button/Button';

const SAMPLE_IMAGE = 'https://picsum.photos/seed/harmonie/1200/800';

const meta: Meta<typeof Lightbox> = {
  title: 'Overlays/Lightbox',
  component: Lightbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Lightbox>;

export const Default: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'Sample image',
    onClose: () => {},
  },
};

export const WithHeaderLeft: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'Sample image',
    headerLeft: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
          A
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-white">Alice</span>
          <span className="text-xs text-white/60">Today at 14:32</span>
        </div>
      </div>
    ),
    onClose: () => {},
  },
};

export const WithHeaderActions: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'Sample image',
    headerActions: (
      <button
        type="button"
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        aria-label="Download"
      >
        <Download size={18} />
      </button>
    ),
    onClose: () => {},
  },
};

export const LoadingSkeleton: Story = {
  args: {
    src: undefined,
    alt: 'Loading image',
    onClose: () => {},
  },
};

const InteractiveDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-center h-screen bg-surface-2">
      <Button onClick={() => setOpen(true)}>Open lightbox</Button>
      {open && (
        <Lightbox
          src={SAMPLE_IMAGE}
          alt="Sample image"
          headerLeft={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
                A
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-white">Alice</span>
                <span className="text-xs text-white/60">Today at 14:32</span>
              </div>
            </div>
          }
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
