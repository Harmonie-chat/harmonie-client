import type { ReactNode } from 'react';
import { splitTextWithUrls } from '../utils/url';
import { isHtmlMessage, sanitizeMessageHtml } from '../utils/messageHtml';
import type { MessageAuthor } from '../types';

interface MessageContentProps {
  content: string;
  mentionedUserIds?: string[];
  mentionMap?: ReadonlyMap<string, MessageAuthor>;
  onMentionClick?: (mention: MessageAuthor, rect: DOMRect) => void;
}

const getMentionLabel = (mention: MessageAuthor) => mention.displayName ?? mention.username;

const getMentionButton = (
  mention: MessageAuthor,
  label: string,
  key: string,
  onMentionClick?: (mention: MessageAuthor, rect: DOMRect) => void
) => (
  <button
    key={key}
    type="button"
    className="inline-flex max-w-full items-center rounded-sm bg-primary/12 px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
    onClick={(event) => onMentionClick?.(mention, event.currentTarget.getBoundingClientRect())}
  >
    <span className="truncate">@{label}</span>
  </button>
);

const canStartMentionAt = (text: string, index: number) =>
  text[index] === '@' && (index === 0 || /\s/u.test(text[index - 1]));

const hasMentionBoundaryAfter = (text: string, index: number) =>
  index >= text.length || /[\s\p{S}.,!?;:)\]]/u.test(text[index]);

const getMentionEnd = (text: string, labelEnd: number) => {
  if (labelEnd >= text.length) return labelEnd;

  if (/\p{S}/u.test(text[labelEnd])) {
    let end = labelEnd;
    while (end < text.length && !/\s/u.test(text[end])) end += 1;
    return end;
  }

  if (!/\s/u.test(text[labelEnd])) return labelEnd;

  let symbolStart = labelEnd;
  while (symbolStart < text.length && /\s/u.test(text[symbolStart])) symbolStart += 1;
  if (symbolStart >= text.length || !/\p{S}/u.test(text[symbolStart])) return labelEnd;

  let end = symbolStart;
  while (end < text.length && !/\s/u.test(text[end])) end += 1;
  return end;
};

const renderTextWithMentions = (
  text: string,
  mentionPills: MessageAuthor[],
  onMentionClick?: (mention: MessageAuthor, rect: DOMRect) => void
) => {
  const candidates = mentionPills.flatMap((mention) => [
    { label: getMentionLabel(mention), mention },
    { label: mention.username, mention },
  ]);
  const uniqueCandidates = Array.from(
    new Map(
      candidates.map((candidate) => [candidate.label.toLocaleLowerCase(), candidate])
    ).values()
  ).sort((a, b) => b.label.length - a.label.length);

  if (uniqueCandidates.length === 0) return text;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (!canStartMentionAt(text, index)) continue;

    const nextText = text.slice(index).toLocaleLowerCase();
    const candidate = uniqueCandidates.find((option) => {
      const token = `@${option.label}`.toLocaleLowerCase();
      return nextText.startsWith(token) && hasMentionBoundaryAfter(text, index + token.length);
    });
    if (!candidate) continue;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }
    const mentionEnd = getMentionEnd(text, index + candidate.label.length + 1);
    nodes.push(
      getMentionButton(
        candidate.mention,
        text.slice(index + 1, mentionEnd),
        `${candidate.mention.userId}-${index}`,
        onMentionClick
      )
    );
    lastIndex = mentionEnd;
    index = lastIndex - 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
};

export const MessageContent = ({
  content,
  mentionedUserIds = [],
  mentionMap,
  onMentionClick,
}: MessageContentProps) => {
  const mentionPills = mentionedUserIds
    .map((userId) => mentionMap?.get(userId))
    .filter((mention): mention is MessageAuthor => Boolean(mention));

  if (isHtmlMessage(content)) {
    const sanitized = sanitizeMessageHtml(content);

    return (
      <div
        className="message-rich-content w-full max-w-full min-w-0 text-sm text-text-2 wrap-break-word space-y-2 [&_.ql-mention]:inline-flex [&_.ql-mention]:max-w-full [&_.ql-mention]:items-center [&_.ql-mention]:rounded-sm [&_.ql-mention]:bg-primary/12 [&_.ql-mention]:px-1.5 [&_.ql-mention]:py-0.5 [&_.ql-mention]:text-xs [&_.ql-mention]:font-medium [&_.ql-mention]:text-primary [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:m-0 [&_blockquote]:border-l-2 [&_blockquote]:border-border-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:rounded-sm [&_code]:bg-surface-3 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:m-0 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:leading-snug [&_h2]:m-0 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:leading-snug [&_h3]:m-0 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:leading-snug [&_ol]:my-0 [&_ol]:pl-5 [&_ol]:list-none [&_p]:m-0 [&_pre]:m-0 [&_pre]:max-w-full [&_pre]:overflow-x-hidden [&_pre]:whitespace-pre-wrap [&_pre]:wrap-break-word [&_pre]:rounded-md [&_pre]:bg-surface-3 [&_pre]:px-3 [&_pre]:py-2 [&_pre]:font-mono [&_pre]:text-xs [&_pre_code]:whitespace-pre-wrap [&_pre_code]:wrap-break-word [&_strong]:font-semibold [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol>li:not([data-list])]:list-decimal [&_ol>li:not([data-list])]:ml-1 [&_li[data-list='ordered']]:list-decimal [&_li[data-list='bullet']]:list-disc [&_li[data-list='ordered']]:ml-1 [&_li[data-list='bullet']]:ml-1"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  const parts = splitTextWithUrls(content);

  return (
    <>
      <p className="m-0 text-sm text-text-2 whitespace-pre-wrap wrap-break-word">
        {parts.map((part, index) =>
          part.type === 'url' ? (
            <a
              key={index}
              href={part.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
            >
              {part.value}
            </a>
          ) : (
            <span key={index}>
              {renderTextWithMentions(part.value, mentionPills, onMentionClick)}
            </span>
          )
        )}
      </p>
    </>
  );
};
