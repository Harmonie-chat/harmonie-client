import { useState } from 'react';
import { stripHtmlToText } from '../utils/messageHtml';

const DRAFT_STORAGE_PREFIX = 'harmonie:message-draft:';

const getDraftStorageKey = (draftKey?: string) =>
  draftKey ? `${DRAFT_STORAGE_PREFIX}${draftKey}` : null;

const readStoredDraft = (draftKey?: string) => {
  const storageKey = getDraftStorageKey(draftKey);
  if (!storageKey || typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(storageKey) ?? '';
  } catch {
    return '';
  }
};

const writeStoredDraft = (draftKey: string | undefined, value: string) => {
  const storageKey = getDraftStorageKey(draftKey);
  if (!storageKey || typeof window === 'undefined') return;

  try {
    if (stripHtmlToText(value)) {
      window.localStorage.setItem(storageKey, value);
      return;
    }

    window.localStorage.removeItem(storageKey);
  } catch {
    // Draft persistence is best effort and must never block writing a message.
  }
};

const clearStoredDraft = (draftKey?: string) => {
  const storageKey = getDraftStorageKey(draftKey);
  if (!storageKey || typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Draft persistence is best effort and must never block writing a message.
  }
};

export const useMessageDraft = (draftKey?: string) => {
  const [content, setContentState] = useState(() => readStoredDraft(draftKey));

  const setContent = (value: string) => {
    setContentState(value);
    writeStoredDraft(draftKey, value);
  };

  const clearDraft = () => {
    setContentState('');
    clearStoredDraft(draftKey);
  };

  return { clearDraft, content, setContent };
};
