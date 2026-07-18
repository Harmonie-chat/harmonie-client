import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  SquareCode,
  Strikethrough,
  TextQuote,
  Underline as UnderlineIcon,
} from 'lucide-react';
import Quill from 'quill';
import type { RichTextMessageInputLabels, ToolbarButtonConfig, ToolbarItem } from '../types';

export const DEFAULT_LABELS: RichTextMessageInputLabels = {
  toggleFormatting: 'Show or hide formatting tools',
  openEmoji: 'Open emoji picker',
  emojiSearchPlaceholder: 'Search',
  header1: 'Heading 1',
  header2: 'Heading 2',
  header3: 'Heading 3',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strikethrough',
  bulletList: 'Bulleted list',
  orderedList: 'Numbered list',
  quote: 'Quote',
  code: 'Code',
  codeBlock: 'Code block',
  link: 'Link',
  editLink: 'Edit',
  removeLink: 'Remove',
  linkDialogTitle: 'Add link',
  linkTextLabel: 'Text',
  linkUrlLabel: 'Link',
  cancel: 'Cancel',
  save: 'Save',
  send: 'Send',
  attachFile: 'Attach a file',
};

export const createToolbarButtons = (
  labels: RichTextMessageInputLabels,
  openLinkDialog: (quill: Quill) => void
): ToolbarButtonConfig[] => [
  {
    key: 'header-1',
    icon: Heading1,
    label: labels.header1,
    selected: (formats) => formats.header === 1,
    run: (quill, formats) => {
      const range = quill.getSelection(true);
      if (!range) return;

      quill.focus();
      quill.formatLine(
        range.index,
        Math.max(range.length, 1),
        'header',
        formats.header === 1 ? false : 1,
        'user'
      );
    },
  },
  {
    key: 'header-2',
    icon: Heading2,
    label: labels.header2,
    selected: (formats) => formats.header === 2,
    run: (quill, formats) => {
      const range = quill.getSelection(true);
      if (!range) return;

      quill.focus();
      quill.formatLine(
        range.index,
        Math.max(range.length, 1),
        'header',
        formats.header === 2 ? false : 2,
        'user'
      );
    },
  },
  {
    key: 'header-3',
    icon: Heading3,
    label: labels.header3,
    selected: (formats) => formats.header === 3,
    run: (quill, formats) => {
      const range = quill.getSelection(true);
      if (!range) return;

      quill.focus();
      quill.formatLine(
        range.index,
        Math.max(range.length, 1),
        'header',
        formats.header === 3 ? false : 3,
        'user'
      );
    },
  },
  {
    key: 'bold',
    icon: Bold,
    label: labels.bold,
    selected: (formats) => !!formats.bold,
    run: (quill, formats) => {
      quill.focus();
      quill.format('bold', !formats.bold, 'user');
    },
  },
  {
    key: 'italic',
    icon: Italic,
    label: labels.italic,
    selected: (formats) => !!formats.italic,
    run: (quill, formats) => {
      quill.focus();
      quill.format('italic', !formats.italic, 'user');
    },
  },
  {
    key: 'underline',
    icon: UnderlineIcon,
    label: labels.underline,
    selected: (formats) => !!formats.underline,
    run: (quill, formats) => {
      quill.focus();
      quill.format('underline', !formats.underline, 'user');
    },
  },
  {
    key: 'strike',
    icon: Strikethrough,
    label: labels.strike,
    selected: (formats) => !!formats.strike,
    run: (quill, formats) => {
      quill.focus();
      quill.format('strike', !formats.strike, 'user');
    },
  },
  {
    key: 'bullet-list',
    icon: List,
    label: labels.bulletList,
    selected: (formats) => formats.list === 'bullet',
    run: (quill, formats) => {
      quill.focus();
      quill.format('list', formats.list === 'bullet' ? false : 'bullet', 'user');
    },
  },
  {
    key: 'ordered-list',
    icon: ListOrdered,
    label: labels.orderedList,
    selected: (formats) => formats.list === 'ordered',
    run: (quill, formats) => {
      quill.focus();
      quill.format('list', formats.list === 'ordered' ? false : 'ordered', 'user');
    },
  },
  {
    key: 'quote',
    icon: TextQuote,
    label: labels.quote,
    selected: (formats) => !!formats.blockquote,
    run: (quill, formats) => {
      quill.focus();
      quill.format('blockquote', !formats.blockquote, 'user');
    },
  },
  {
    key: 'code',
    icon: Code2,
    label: labels.code,
    selected: (formats) => !!formats.code,
    run: (quill, formats) => {
      quill.focus();
      quill.format('code', !formats.code, 'user');
    },
  },
  {
    key: 'code-block',
    icon: SquareCode,
    label: labels.codeBlock,
    selected: (formats) => !!formats['code-block'],
    run: (quill, formats) => {
      const range = quill.getSelection(true);
      if (!range) return;

      quill.focus();
      quill.formatLine(
        range.index,
        Math.max(range.length, 1),
        'code-block',
        !formats['code-block'],
        'user'
      );
    },
  },
  {
    key: 'link',
    icon: Link2,
    label: labels.link,
    selected: (formats) => typeof formats.link === 'string' && formats.link.length > 0,
    run: (quill) => {
      quill.focus();
      openLinkDialog(quill);
    },
  },
];

export const createToolbarItems = (toolbarButtons: ToolbarButtonConfig[]): ToolbarItem[] => [
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'header-1')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'header-2')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'header-3')! },
  { type: 'separator', key: 'sep-0' },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'bold')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'italic')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'underline')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'strike')! },
  { type: 'separator', key: 'sep-1' },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'link')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'bullet-list')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'ordered-list')! },
  { type: 'separator', key: 'sep-2' },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'quote')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'code')! },
  { type: 'button', config: toolbarButtons.find((button) => button.key === 'code-block')! },
];
