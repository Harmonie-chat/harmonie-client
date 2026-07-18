import { describe, expect, it } from 'vitest';
import { getRichTextMessageInputLabels } from './richTextMessageInputLabels';

describe('getRichTextMessageInputLabels', () => {
  it('maps rich text input labels to translation keys', () => {
    const labels = getRichTextMessageInputLabels((key) => `translated:${key}`);

    expect(labels).toEqual({
      toggleFormatting: 'translated:channel.input.format.toggle',
      openEmoji: 'translated:channel.input.openEmoji',
      emojiSearchPlaceholder: 'translated:channel.input.emojiSearchPlaceholder',
      header1: 'translated:channel.input.format.header1',
      header2: 'translated:channel.input.format.header2',
      header3: 'translated:channel.input.format.header3',
      bold: 'translated:channel.input.format.bold',
      italic: 'translated:channel.input.format.italic',
      underline: 'translated:channel.input.format.underline',
      strike: 'translated:channel.input.format.strike',
      bulletList: 'translated:channel.input.format.bulletList',
      orderedList: 'translated:channel.input.format.orderedList',
      quote: 'translated:channel.input.format.quote',
      code: 'translated:channel.input.format.code',
      codeBlock: 'translated:channel.input.format.codeBlock',
      link: 'translated:channel.input.format.link',
      editLink: 'translated:channel.input.format.editLink',
      removeLink: 'translated:channel.input.format.removeLink',
      linkDialogTitle: 'translated:channel.input.format.linkDialogTitle',
      linkTextLabel: 'translated:channel.input.format.linkTextLabel',
      linkUrlLabel: 'translated:channel.input.format.linkUrlLabel',
      cancel: 'translated:channel.input.cancel',
      save: 'translated:channel.input.save',
      send: 'translated:channel.input.send',
      attachFile: 'translated:channel.input.attachFile',
    });
  });
});
