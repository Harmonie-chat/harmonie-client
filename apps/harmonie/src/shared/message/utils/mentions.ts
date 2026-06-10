import type { RichTextMentionOption } from '@harmonie/ui';
import { stripHtmlToText } from './messageHtml';

const getMentionLabel = (mention: RichTextMentionOption) => mention.displayName ?? mention.username;

export const filterMentionedUserIdsFromContent = (
  content: string,
  selectedUserIds: Iterable<string>,
  mentionMap: ReadonlyMap<string, RichTextMentionOption>
) => {
  const text = stripHtmlToText(content).toLocaleLowerCase();
  const nextIds: string[] = [];

  for (const userId of selectedUserIds) {
    const mention = mentionMap.get(userId);
    if (!mention) continue;

    const label = getMentionLabel(mention).toLocaleLowerCase();
    if (text.includes(`@${label}`) || text.includes(`@${mention.username.toLocaleLowerCase()}`)) {
      nextIds.push(userId);
    }
  }

  return Array.from(new Set(nextIds)).slice(0, 50);
};
