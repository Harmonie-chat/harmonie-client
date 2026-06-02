import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Message } from '@/types/channel';

interface SearchTargetState {
  searchTarget?: {
    messageId: string;
    nonce: string;
  };
}

interface UseTextChannelSearchTargetParams {
  channelId?: string;
  guildId?: string;
  messages: Message[];
  loading: boolean;
  error: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  previousMessageCountRef: MutableRefObject<number>;
  suppressNextScrollEffectsRef: MutableRefObject<boolean>;
  loadUntilMessage: (messageId: string) => Promise<boolean>;
}

export const useTextChannelSearchTarget = ({
  channelId,
  guildId,
  messages,
  loading,
  error,
  scrollRef,
  previousMessageCountRef,
  suppressNextScrollEffectsRef,
  loadUntilMessage,
}: UseTextChannelSearchTargetParams) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [activeSearchTarget, setActiveSearchTarget] = useState<{
    messageId: string;
    nonce: string;
  } | null>(null);
  const seekingTargetRef = useRef(false);
  const handledSearchTargetNonceRef = useRef<string | null>(null);

  const clearSearchTargetState = useCallback(() => {
    if (!guildId || !channelId) return;
    navigate(`/guilds/${guildId}/channels/${channelId}`, { replace: true, state: null });
  }, [channelId, guildId, navigate]);

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const element = scrollRef.current;
      if (!element) return false;

      const targetElement = element.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
      if (!targetElement) return false;

      requestAnimationFrame(() => {
        suppressNextScrollEffectsRef.current = true;
        const containerRect = element.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const nextScrollTop =
          element.scrollTop +
          (targetRect.top - containerRect.top) -
          element.clientHeight / 2 +
          targetRect.height / 2;
        element.scrollTop = Math.max(0, nextScrollTop);
      });

      setSelectedMessageId(messageId);
      previousMessageCountRef.current = messages.length;
      if (activeSearchTarget) {
        handledSearchTargetNonceRef.current = activeSearchTarget.nonce;
      }
      setActiveSearchTarget(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          clearSearchTargetState();
        });
      });
      return true;
    },
    [
      activeSearchTarget,
      clearSearchTargetState,
      messages.length,
      previousMessageCountRef,
      scrollRef,
      suppressNextScrollEffectsRef,
    ]
  );

  useEffect(() => {
    setSelectedMessageId(null);
    setActiveSearchTarget(null);
    seekingTargetRef.current = false;
  }, [channelId]);

  useEffect(() => {
    if (!selectedMessageId) return;

    const ignoreInteractionsUntil = Date.now() + 250;

    const clearSelection = () => {
      if (Date.now() < ignoreInteractionsUntil) return;
      setSelectedMessageId(null);
    };

    document.addEventListener('pointerdown', clearSelection);
    document.addEventListener('wheel', clearSelection, { passive: true });
    document.addEventListener('touchstart', clearSelection, { passive: true });
    window.addEventListener('keydown', clearSelection);

    return () => {
      document.removeEventListener('pointerdown', clearSelection);
      document.removeEventListener('wheel', clearSelection);
      document.removeEventListener('touchstart', clearSelection);
      window.removeEventListener('keydown', clearSelection);
    };
  }, [selectedMessageId]);

  useEffect(() => {
    const state = location.state as SearchTargetState | null;
    const nextTarget = state?.searchTarget;
    if (!nextTarget) return;
    if (handledSearchTargetNonceRef.current === nextTarget.nonce) return;
    setActiveSearchTarget(nextTarget);
  }, [location.state]);

  useEffect(() => {
    const targetMessageId = activeSearchTarget?.messageId;
    if (!targetMessageId) {
      seekingTargetRef.current = false;
      return;
    }

    if (messages.some((message) => message.messageId === targetMessageId)) {
      seekingTargetRef.current = false;
      return;
    }

    if (loading || error || seekingTargetRef.current) return;

    let cancelled = false;
    seekingTargetRef.current = true;

    const ensureMessageVisible = async () => {
      const found = await loadUntilMessage(targetMessageId);
      if (cancelled) return;

      seekingTargetRef.current = false;

      if (!found) {
        handledSearchTargetNonceRef.current = activeSearchTarget?.nonce ?? null;
        setActiveSearchTarget(null);
        clearSearchTargetState();
      }
    };

    ensureMessageVisible().catch(() => {
      seekingTargetRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [activeSearchTarget, clearSearchTargetState, error, loadUntilMessage, loading, messages]);

  useLayoutEffect(() => {
    const targetMessageId = activeSearchTarget?.messageId;
    if (!targetMessageId) return;
    if (!messages.some((message) => message.messageId === targetMessageId)) return;

    let frameId = 0;
    let attempts = 0;

    const tryScroll = () => {
      if (scrollToMessage(targetMessageId)) return;
      attempts += 1;
      if (attempts < 10) {
        frameId = requestAnimationFrame(tryScroll);
      }
    };

    tryScroll();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [activeSearchTarget, messages, scrollToMessage]);

  return {
    activeSearchTarget,
    selectedMessageId,
    seekingTargetRef,
  };
};
