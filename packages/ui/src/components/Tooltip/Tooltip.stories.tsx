import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Settings } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';
import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Feedback/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  args: {
    content: 'Copy link',
    side: 'top',
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <div className="flex h-32 items-center justify-center p-8">
      <Tooltip {...args}>
        <Button type="button">Hover me</Button>
      </Tooltip>
    </div>
  ),
};

export const Placements: Story = {
  render: () => (
    <div className="grid min-h-56 place-items-center p-10">
      <div className="grid grid-cols-3 items-center gap-5">
        <div />
        <Tooltip content="Tooltip above" side="top">
          <IconButton aria-label="Settings">
            <Settings size={16} />
          </IconButton>
        </Tooltip>
        <div />
        <Tooltip content="Tooltip left" side="left">
          <IconButton aria-label="Copy">
            <Copy size={16} />
          </IconButton>
        </Tooltip>
        <div className="h-10 w-10" />
        <Tooltip content="Tooltip right" side="right">
          <IconButton aria-label="Copy">
            <Copy size={16} />
          </IconButton>
        </Tooltip>
        <div />
        <Tooltip content="Tooltip below" side="bottom">
          <IconButton aria-label="Settings">
            <Settings size={16} />
          </IconButton>
        </Tooltip>
        <div />
      </div>
    </div>
  ),
};

const InteractiveTooltipExample = () => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex h-32 items-center justify-center p-8">
      <Tooltip content={copied ? 'Copied' : 'Copy link'}>
        <IconButton
          aria-label={copied ? 'Copied' : 'Copy link'}
          onClick={() => setCopied((value) => !value)}
        >
          <Copy size={16} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveTooltipExample />,
};
