import { emoticon } from 'emoticon';
import { gemoji } from 'gemoji';

const EMOTICONS: Record<string, string> = Object.fromEntries(
  emoticon.flatMap(({ emoticons, emoji }) => emoticons.map((e) => [e, emoji]))
);

const SHORTCODES: Record<string, string> = Object.fromEntries(
  gemoji.flatMap(({ names, emoji }) => names.map((name) => [name, emoji]))
);

const SHORTCODE_RE = /:([a-z0-9_+-]+):$/;
const PARTIAL_SHORTCODE_RE = /:([a-z0-9_+-]{2,})$/;
const INSIDE_SHORTCODE_RE = /:[a-z0-9_+-]+$/;

export interface AutocompleteResult {
  emoji: string;
  name: string;
}

export interface Replacement {
  emoji: string;
  start: number;
  length: number;
}

export const getAutocompleteResults = (textBeforeCursor: string): AutocompleteResult[] => {
  const match = textBeforeCursor.match(PARTIAL_SHORTCODE_RE);
  if (!match) return [];
  const query = match[1];
  const results: AutocompleteResult[] = [];
  for (const emoji of gemoji) {
    for (const name of emoji.names) {
      if (!name.startsWith(query)) continue;
      results.push({ emoji: emoji.emoji, name });
      if (results.length >= 8) return results;
    }
  }
  return results;
};

export const getPartialMatchLength = (textBeforeCursor: string): number => {
  return textBeforeCursor.match(PARTIAL_SHORTCODE_RE)?.[0].length ?? 0;
};

export const resolveReplacement = (
  textBeforeCursor: string,
  cursorPos: number
): Replacement | null => {
  if (!INSIDE_SHORTCODE_RE.test(textBeforeCursor)) {
    for (const [emoticonText, emoji] of Object.entries(EMOTICONS)) {
      if (textBeforeCursor.endsWith(emoticonText)) {
        return { emoji, start: cursorPos - emoticonText.length, length: emoticonText.length };
      }
    }
  }

  const shortcodeMatch = textBeforeCursor.match(SHORTCODE_RE);
  if (shortcodeMatch) {
    const emoji = SHORTCODES[shortcodeMatch[1]];
    if (emoji)
      return {
        emoji,
        start: cursorPos - shortcodeMatch[0].length,
        length: shortcodeMatch[0].length,
      };
  }

  return null;
};
