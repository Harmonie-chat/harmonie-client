import Quill from 'quill';
import { type ActiveFormats } from '../types';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
let mentionBlotRegistered = false;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isHtmlMessage = (content: string) => HTML_TAG_PATTERN.test(content);

export const toEditorHtml = (content: string) => {
  if (!content) return '<p><br></p>';
  if (isHtmlMessage(content)) return content;

  const escaped = content
    .split('\n')
    .map((line) => (line ? escapeHtml(line) : '<br>'))
    .join('<br>');

  return `<p>${escaped}</p>`;
};

export const getEditorHtml = (quill: Quill) => {
  if (quill.getText().trim().length === 0) return '';
  return quill.getSemanticHTML().trim();
};

export const getPlainText = (quill: Quill) => quill.getText().trim();

export const registerMentionBlot = () => {
  if (mentionBlotRegistered) return;

  const Inline = Quill.import('blots/inline') as {
    new (...args: unknown[]): {
      domNode: HTMLElement;
    };
    create: (value?: unknown) => Node;
  };

  class MentionBlot extends Inline {
    static blotName = 'mention';
    static tagName = 'span';
    static className = 'ql-mention';

    static create(value?: unknown) {
      const node = super.create(value) as HTMLElement;
      if (typeof value === 'string') {
        node.setAttribute('data-user-id', value);
      }
      node.setAttribute('spellcheck', 'false');
      return node;
    }

    static formats(node: HTMLElement) {
      return node.getAttribute('data-user-id') ?? true;
    }
  }

  Quill.register({ 'formats/mention': MentionBlot });
  mentionBlotRegistered = true;
};

export const normalizeHtml = (value: string) => value.replace(/\s+/g, ' ').trim();

const applyInlineFormatWithHistory = (
  quill: Quill,
  format: 'bold' | 'italic' | 'underline',
  active: boolean
) => {
  quill.history.cutoff();
  quill.format(format, !active, 'user');
  quill.history.cutoff();
};

export const registerQuillKeyboardBindings = (quill: Quill) => {
  quill.keyboard.addBinding(
    { key: 'b', shortKey: true },
    { format: ['bold'] },
    (_range: unknown, context: { format: ActiveFormats }) => {
      applyInlineFormatWithHistory(quill, 'bold', !!context.format.bold);
      return false;
    }
  );

  quill.keyboard.addBinding(
    { key: 'i', shortKey: true },
    { format: ['italic'] },
    (_range: unknown, context: { format: ActiveFormats }) => {
      applyInlineFormatWithHistory(quill, 'italic', !!context.format.italic);
      return false;
    }
  );

  quill.keyboard.addBinding(
    { key: 'u', shortKey: true },
    { format: ['underline'] },
    (_range: unknown, context: { format: ActiveFormats }) => {
      applyInlineFormatWithHistory(quill, 'underline', !!context.format.underline);
      return false;
    }
  );
};
