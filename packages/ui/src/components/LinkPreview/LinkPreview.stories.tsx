import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LinkPreview } from './LinkPreview';

const meta: Meta<typeof LinkPreview> = {
  title: 'Display/LinkPreview',
  component: LinkPreview,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    url: 'https://harmonie.app/blog/link-previews',
    label: 'Harmonie',
    host: 'harmonie.app',
    title: 'Designing calmer link previews for busy conversations',
    description:
      'A compact preview card keeps enough context visible without pulling the whole thread out of rhythm.',
    imageUrl:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=640&q=80',
    imageAlt: 'Workspace desk with a laptop and soft daylight',
    ariaLabel: 'Open link preview Designing calmer link previews for busy conversations',
  },
};

export default meta;
type Story = StoryObj<typeof LinkPreview>;

export const Default: Story = {};

export const WithoutImage: Story = {
  args: {
    imageUrl: null,
    imageAlt: undefined,
    title: 'Release notes',
    description: 'Small improvements to message rendering, attachments, and keyboard navigation.',
  },
};

export const LongContent: Story = {
  args: {
    label: 'Very Long Publication Name',
    host: 'research.example.com',
    title:
      'A long article title that should wrap across two lines without changing the width of the preview card',
    description:
      'This longer summary checks that dense metadata remains readable, clipped, and stable inside the preview layout.',
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=80',
    imageAlt: 'Laptop showing analytics on a desk',
  },
};

export const PortraitImage: Story = {
  args: {
    label: 'Profile Journal',
    host: 'journal.example.com',
    title: 'Portrait media keeps its original rhythm',
    description: 'The preview image stays centered and respects its natural aspect ratio.',
    imageUrl:
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=480&q=80',
    imageAlt: 'Portrait photograph in soft light',
  },
};

const InteractiveExample = () => {
  const [openCount, setOpenCount] = useState(0);

  return (
    <div className="flex w-[360px] flex-col gap-2">
      <LinkPreview
        url="https://harmonie.app/docs"
        label="Harmonie Docs"
        host="harmonie.app"
        title="Keyboard-first message tools"
        description="Clicking this preview updates the local story state instead of opening a new tab."
        imageUrl={null}
        ariaLabel="Open link preview Keyboard-first message tools"
        onClick={(event) => {
          event.preventDefault();
          setOpenCount((current) => current + 1);
        }}
      />
      <span className="text-xs text-text-3">Opened {openCount} time(s)</span>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};
