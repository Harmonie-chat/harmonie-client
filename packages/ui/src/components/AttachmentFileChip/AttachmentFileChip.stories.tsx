import type { Meta, StoryObj } from '@storybook/react';
import { Download, X } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';
import { AttachmentFileChip } from './AttachmentFileChip';

const meta: Meta<typeof AttachmentFileChip> = {
  title: 'Display/AttachmentFileChip',
  component: AttachmentFileChip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof AttachmentFileChip>;

export const Default: Story = {
  args: { fileName: 'document.pdf', fileSize: '1.2 MB' },
};

export const WithDownload: Story = {
  args: {
    fileName: 'report-2024.xlsx',
    fileSize: '340 KB',
    actions: (
      <IconButton size="small" variant="ghost" aria-label="Download">
        <Download size={14} />
      </IconButton>
    ),
  },
};

export const WithDownloadAndDelete: Story = {
  args: {
    fileName: 'design-specs.fig',
    fileSize: '8.7 MB',
    actions: (
      <>
        <IconButton size="small" variant="ghost" aria-label="Download">
          <Download size={14} />
        </IconButton>
        <IconButton size="small" variant="ghost" aria-label="Delete">
          <X size={14} />
        </IconButton>
      </>
    ),
  },
};

export const LongFileName: Story = {
  args: {
    fileName: 'very-long-file-name-that-should-be-truncated-properly.pdf',
    fileSize: '2.4 MB',
  },
};
