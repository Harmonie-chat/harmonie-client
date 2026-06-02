import type { Meta, StoryObj } from '@storybook/react-vite';
import { X } from 'lucide-react';
import { AttachmentImage } from './AttachmentImage';

const SAMPLE_IMAGE = 'https://picsum.photos/seed/attach/400/300';

const meta: Meta<typeof AttachmentImage> = {
  title: 'Display/AttachmentImage',
  component: AttachmentImage,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof AttachmentImage>;

export const Default: Story = {
  args: { src: SAMPLE_IMAGE, alt: 'Sample image', openLabel: 'Open image' },
};

export const Loading: Story = {
  args: { src: undefined, alt: 'Loading' },
};

export const WithDeleteOverlay: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'Sample image',
    openLabel: 'Open image',
    topRightAction: (
      <button
        type="button"
        className="p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        aria-label="Delete"
      >
        <X size={12} />
      </button>
    ),
  },
};
