import DOMPurify from 'dompurify';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const HTML_BLOCK_TAG_PATTERN = /<\/?(?:blockquote|div|h[1-6]|li|ol|p|pre|ul)(?:\s[^>]*)?>/gi;
const HTML_LINE_BREAK_PATTERN = /<br\s*\/?>/gi;

const MESSAGE_HTML_ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'u',
  'ul',
  's',
  'span',
];

const MESSAGE_HTML_ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'class',
  'contenteditable',
  'data-list',
  'data-user-id',
];

export const isHtmlMessage = (content: string) => HTML_TAG_PATTERN.test(content);

const decodeHtmlEntities = (content: string) => {
  if (!content.includes('&') || typeof document === 'undefined') return content;

  const textarea = document.createElement('textarea');
  textarea.innerHTML = content;
  return textarea.value;
};

const normalizeTextLines = (content: string) =>
  content
    .split('\n')
    .flatMap((line) => {
      const normalized = line.replace(/\s+/g, ' ').trim();
      return normalized ? [normalized] : [];
    })
    .join('\n');

export const stripHtmlToText = (content: string) => {
  if (!isHtmlMessage(content)) return decodeHtmlEntities(content).trim();

  return normalizeTextLines(
    decodeHtmlEntities(
      content
        .replace(HTML_LINE_BREAK_PATTERN, '\n')
        .replace(HTML_BLOCK_TAG_PATTERN, '\n')
        .replace(/<[^>]*>/g, '')
    )
  );
};

const isUnformattedRichTextHtml = (content: string) => {
  if (!isHtmlMessage(content) || typeof document === 'undefined') return false;

  const template = document.createElement('template');
  template.innerHTML = content.trim();
  const elements = Array.from(template.content.querySelectorAll('*'));

  return elements.every(
    (element) =>
      ['BR', 'P'].includes(element.tagName) &&
      (element.tagName === 'BR' || element.attributes.length === 0)
  );
};

export const getMessagePayloadContent = (content: string) =>
  isUnformattedRichTextHtml(content) ? stripHtmlToText(content) : content;

const removeTrailingEmptyBlocks = (content: string) =>
  content
    .replace(/(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+$/gi, '')
    .replace(/(?:<blockquote>(?:\s|&nbsp;|<br\s*\/?>)*<\/blockquote>\s*)+$/gi, '')
    .trim();

export const sanitizeMessageHtml = (content: string) =>
  removeTrailingEmptyBlocks(
    DOMPurify.sanitize(content, {
      ALLOWED_TAGS: MESSAGE_HTML_ALLOWED_TAGS,
      ALLOWED_ATTR: MESSAGE_HTML_ALLOWED_ATTR,
    })
  );
