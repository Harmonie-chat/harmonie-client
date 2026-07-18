import { Bold } from 'lucide-react';
import Quill from 'quill';

export type QuillRange = { index: number; length: number } | null;
export type ActiveFormats = Record<string, unknown>;

export interface RichTextMentionOption {
  userId: string;
  username: string;
  displayName?: string | null;
}

export interface RichTextMessageInputLabels {
  toggleFormatting: string;
  openEmoji: string;
  emojiSearchPlaceholder: string;
  header1: string;
  header2: string;
  header3: string;
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  bulletList: string;
  orderedList: string;
  quote: string;
  code: string;
  codeBlock: string;
  link: string;
  editLink: string;
  removeLink: string;
  linkDialogTitle: string;
  linkTextLabel: string;
  linkUrlLabel: string;
  cancel: string;
  save: string;
  send: string;
  attachFile: string;
}

export interface ToolbarButtonConfig {
  key: string;
  icon: typeof Bold;
  label: string;
  selected: (formats: ActiveFormats) => boolean;
  run: (quill: Quill, formats: ActiveFormats) => void;
}

export type ToolbarItem =
  | { type: 'button'; config: ToolbarButtonConfig }
  | { type: 'separator'; key: string };
