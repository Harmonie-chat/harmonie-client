import {
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
  scrollRef: RefObject<HTMLDivElement | null>;
  previousMessageCountRef: MutableRefObject<number>;
  suppressNextScrollEffectsRef: MutableRefObject<boolean>;
}

export const useTextChannelSearchTarget = ({
  channelId,
  guildId,
  messages,
  scrollRef,
  previousMessageCountRef,
  suppressNextScrollEffectsRef,
}: UseTextChannelSearchTargetParams) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedMessageState, setSelectedMessageState] = useState<{
    channelId?: string;
    messageId: string | null;
  }>({ channelId: undefined, messageId: null });
  const selectedMessageId =
    selectedMessageState.channelId === channelId ? selectedMessageState.messageId : null;
  const seekingTargetRef = useRef(false);
  const [handledSearchTargetNonce, setHandledSearchTargetNonce] = useState<string | null>(null);
  const locationState = location.state as SearchTargetState | null;
  const locationSearchTarget = locationState?.searchTarget;
  const activeSearchTarget =
    locationSearchTarget && handledSearchTargetNonce !== locationSearchTarget.nonce
      ? locationSearchTarget
      : null;

  useEffect(() => {
    if (!selectedMessageId) return;

    const ignoreInteractionsUntil = Date.now() + 250;

    const clearSelection = () => {
      if (Date.now() < ignoreInteractionsUntil) return;
      setSelectedMessageState({ channelId, messageId: null });
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
  }, [channelId, selectedMessageId]);

  useLayoutEffect(() => {
    const targetMessageId = activeSearchTarget?.messageId;
    if (!targetMessageId) return;
    if (!messages.some((message) => message.messageId === targetMessageId)) return;

    let frameId = 0;
    let attempts = 0;

    const tryScroll = () => {
      const element = scrollRef.current;
      const targetElement = element?.querySelector<HTMLElement>(
        `[data-message-id="${targetMessageId}"]`
      );

      if (element && targetElement) {
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

        setSelectedMessageState({ channelId, messageId: targetMessageId });
        previousMessageCountRef.current = messages.length;
        setHandledSearchTargetNonce(activeSearchTarget.nonce);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (guildId && channelId) {
              navigate(`/guilds/${guildId}/channels/${channelId}`, { replace: true, state: null });
            }
          });
        });
        return;
      }

      attempts += 1;
      if (attempts < 10) {
        frameId = requestAnimationFrame(tryScroll);
      }
    };

    tryScroll();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    activeSearchTarget,
    channelId,
    guildId,
    messages,
    navigate,
    previousMessageCountRef,
    scrollRef,
    suppressNextScrollEffectsRef,
  ]);

  return {
    activeSearchTarget,
    setHandledSearchTargetNonce,
    selectedMessageId,
    seekingTargetRef,
  };
};
