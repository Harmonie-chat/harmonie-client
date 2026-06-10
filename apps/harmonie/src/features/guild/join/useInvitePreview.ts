import { useEffect, useState } from 'react';
import { getInvitePreview } from '@/api/guilds';
import type { InvitePreview } from '@/types/guild';

const MIN_CODE_LENGTH = 8;
const DEBOUNCE_MS = 400;

interface UseInvitePreviewResult {
  preview: InvitePreview | null;
  isLoading: boolean;
  notFound: boolean;
}

interface InvitePreviewState {
  code: string;
  preview: InvitePreview | null;
  notFound: boolean;
}

export const useInvitePreview = (inviteCode: string): UseInvitePreviewResult => {
  const code = inviteCode.trim();
  const canSearch = code.length >= MIN_CODE_LENGTH;
  const [state, setState] = useState<InvitePreviewState>({
    code: '',
    preview: null,
    notFound: false,
  });
  const isCurrent = canSearch && state.code === code;

  useEffect(() => {
    if (!canSearch) return;
    const timer = setTimeout(() => {
      getInvitePreview(code)
        .then((data) => setState({ code, preview: data, notFound: false }))
        .catch((err: { status?: number }) =>
          setState({ code, preview: null, notFound: err?.status === 404 })
        );
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [canSearch, code]);

  return {
    preview: isCurrent ? state.preview : null,
    isLoading: canSearch && !isCurrent,
    notFound: isCurrent ? state.notFound : false,
  };
};
