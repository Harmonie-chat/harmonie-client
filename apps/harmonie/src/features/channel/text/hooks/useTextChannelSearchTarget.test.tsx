import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, type MutableRefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTextChannelSearchTarget } from './useTextChannelSearchTarget';
import { createMessage } from '@/test/fixtures';
import type { Message } from '@/types/channel';

const mocks = vi.hoisted(() => ({
  locationState: null as null | { searchTarget?: { messageId: string; nonce: string } },
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ state: mocks.locationState }),
    useNavigate: () => mocks.navigate,
  };
});

const message = (messageId: string): Message => createMessage({ messageId });

const HookConsumer = ({
  channelId = 'channel-1',
  guildId = 'guild-1',
  messages = [message('message-1')],
  previousMessageCountRef,
  suppressNextScrollEffectsRef,
}: {
  channelId?: string;
  guildId?: string;
  messages?: Message[];
  previousMessageCountRef: MutableRefObject<number>;
  suppressNextScrollEffectsRef: MutableRefObject<boolean>;
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const result = useTextChannelSearchTarget({
    channelId,
    guildId,
    messages,
    scrollRef,
    previousMessageCountRef,
    suppressNextScrollEffectsRef,
  });

  return (
    <div>
      <span data-testid="active">{result.activeSearchTarget?.messageId ?? 'none'}</span>
      <span data-testid="selected">{result.selectedMessageId ?? 'none'}</span>
      <span data-testid="seeking">{String(result.seekingTargetRef.current)}</span>
      <button type="button" onClick={() => result.setHandledSearchTargetNonce('nonce-1')}>
        Handle
      </button>
      <div ref={scrollRef} data-testid="scroll">
        <article data-message-id="message-1">Message</article>
      </div>
    </div>
  );
};

const renderHookConsumer = (props: Partial<Parameters<typeof HookConsumer>[0]> = {}) => {
  const previousMessageCountRef = { current: 0 };
  const suppressNextScrollEffectsRef = { current: false };
  const view = render(
    <HookConsumer
      previousMessageCountRef={previousMessageCountRef}
      suppressNextScrollEffectsRef={suppressNextScrollEffectsRef}
      {...props}
    />
  );

  return { previousMessageCountRef, suppressNextScrollEffectsRef, ...view };
};

describe('useTextChannelSearchTarget', () => {
  beforeEach(() => {
    mocks.locationState = null;
    mocks.navigate.mockReset();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  it('scrolls to a search target, selects it, and clears navigation state', async () => {
    mocks.locationState = { searchTarget: { messageId: 'message-1', nonce: 'nonce-1' } };
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);

    const { previousMessageCountRef, suppressNextScrollEffectsRef } = renderHookConsumer();

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('message-1'));
    expect(suppressNextScrollEffectsRef.current).toBe(true);
    expect(previousMessageCountRef.current).toBe(1);
    expect(mocks.navigate).toHaveBeenCalledWith('/guilds/guild-1/channels/channel-1', {
      replace: true,
      state: null,
    });

    now.mockReturnValue(2000);
    fireEvent.pointerDown(document);

    expect(screen.getByTestId('selected')).toHaveTextContent('none');
  });

  it('keeps an active target when the message is not loaded yet', () => {
    mocks.locationState = { searchTarget: { messageId: 'missing-message', nonce: 'nonce-1' } };

    renderHookConsumer({ messages: [message('message-1')] });

    expect(screen.getByTestId('active')).toHaveTextContent('missing-message');
    expect(screen.getByTestId('selected')).toHaveTextContent('none');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('ignores a target nonce that was already handled and resets selection when channel changes', async () => {
    mocks.locationState = { searchTarget: { messageId: 'message-1', nonce: 'nonce-1' } };
    const { rerender, previousMessageCountRef, suppressNextScrollEffectsRef } =
      renderHookConsumer();

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('message-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Handle' }));

    expect(screen.getByTestId('active')).toHaveTextContent('none');

    rerender(
      <HookConsumer
        channelId="channel-2"
        previousMessageCountRef={previousMessageCountRef}
        suppressNextScrollEffectsRef={suppressNextScrollEffectsRef}
      />
    );

    expect(screen.getByTestId('selected')).toHaveTextContent('none');
  });
});
