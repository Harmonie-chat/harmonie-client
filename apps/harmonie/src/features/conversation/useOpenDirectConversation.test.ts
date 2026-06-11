import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpenDirectConversation } from './useOpenDirectConversation';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  openDirectConversation: vi.fn(),
  addConversation: vi.fn(),
  currentUser: null as null | {
    userId: string;
    username: string;
    displayName?: string | null;
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('@/api/conversations', () => ({
  openDirectConversation: mocks.openDirectConversation,
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: mocks.currentUser }),
}));

vi.mock('./ConversationContext', () => ({
  useConversations: () => ({ addConversation: mocks.addConversation }),
}));

describe('useOpenDirectConversation', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.openDirectConversation.mockReset();
    mocks.addConversation.mockReset();
    mocks.currentUser = null;
  });

  it('opens a direct conversation and includes the current user participant', async () => {
    mocks.currentUser = { userId: 'user-1', username: 'ada', displayName: 'Ada' };
    mocks.openDirectConversation.mockResolvedValueOnce({
      conversationId: 'conversation-1',
      name: null,
      createdAtUtc: '2024-01-01T00:00:00.000Z',
    });
    const { result } = renderHook(() => useOpenDirectConversation());

    await act(async () => {
      await result.current({
        userId: 'user-2',
        username: 'grace',
        displayName: 'Grace',
      });
    });

    expect(mocks.openDirectConversation).toHaveBeenCalledWith('user-2');
    expect(mocks.addConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conversation-1',
        type: 'Direct',
        participants: [
          expect.objectContaining({ userId: 'user-2', displayName: 'Grace' }),
          expect.objectContaining({ userId: 'user-1', displayName: 'Ada' }),
        ],
      })
    );
    expect(mocks.navigate).toHaveBeenCalledWith('/conversations/conversation-1');
  });

  it('opens a direct conversation without a current user participant', async () => {
    mocks.currentUser = null;
    mocks.openDirectConversation.mockResolvedValueOnce({
      conversationId: 'conversation-2',
      name: 'Direct',
      createdAtUtc: '2024-01-01T00:00:00.000Z',
    });
    const { result } = renderHook(() => useOpenDirectConversation());

    await act(async () => {
      await result.current({
        userId: 'user-2',
        username: 'grace',
      });
    });

    expect(mocks.addConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Direct',
        participants: [expect.objectContaining({ userId: 'user-2' })],
      })
    );
  });
});
