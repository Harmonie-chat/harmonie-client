import type { RichTextMessageInputLabels } from '@harmonie/ui';

interface Translate {
  (key: string): string;
}

export const getRichTextMessageInputLabels = (t: Translate): RichTextMessageInputLabels => ({
  toggleFormatting: t('channel.input.format.toggle'),
  openEmoji: t('channel.input.openEmoji'),
  emojiSearchPlaceholder: t('channel.input.emojiSearchPlaceholder'),
  header1: t('channel.input.format.header1'),
  header2: t('channel.input.format.header2'),
  header3: t('channel.input.format.header3'),
  bold: t('channel.input.format.bold'),
  italic: t('channel.input.format.italic'),
  underline: t('channel.input.format.underline'),
  strike: t('channel.input.format.strike'),
  bulletList: t('channel.input.format.bulletList'),
  orderedList: t('channel.input.format.orderedList'),
  quote: t('channel.input.format.quote'),
  code: t('channel.input.format.code'),
  codeBlock: t('channel.input.format.codeBlock'),
  link: t('channel.input.format.link'),
  editLink: t('channel.input.format.editLink'),
  removeLink: t('channel.input.format.removeLink'),
  linkDialogTitle: t('channel.input.format.linkDialogTitle'),
  linkTextLabel: t('channel.input.format.linkTextLabel'),
  linkUrlLabel: t('channel.input.format.linkUrlLabel'),
  cancel: t('channel.input.cancel'),
  save: t('channel.input.save'),
  send: t('channel.input.send'),
  attachFile: t('channel.input.attachFile'),
});
