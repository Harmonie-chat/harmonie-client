import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInvitePreview } from './useInvitePreview';
import type { InvitePreview } from '@/types/guild';

const getInvitePreviewMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/guilds', () => ({
  getInvitePreview: getInvitePreviewMock,
}));

const preview = (input: Partial<InvitePreview> = {}): InvitePreview => ({
  guildName: 'Guild',
  guildIconFileId: null,
  guildIcon: null,
  memberCount: 3,
  usesCount: 1,
  maxUses: null,
  expiresAtUtc: null,
  ...input,
});

describe('useInvitePreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getInvitePreviewMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not search before the code is long enough', () => {
    const { result } = renderHook(() => useInvitePreview('short'));

    expect(result.current).toEqual({
      preview: null,
      isLoading: false,
      notFound: false,
    });
    expect(getInvitePreviewMock).not.toHaveBeenCalled();
  });

  it('loads a debounced invite preview for trimmed codes', async () => {
    getInvitePreviewMock.mockResolvedValueOnce(preview({ guildName: 'Design' }));
    const { result } = renderHook(() => useInvitePreview('  abcdefgh  '));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(result.current.preview?.guildName).toBe('Design');
    expect(getInvitePreviewMock).toHaveBeenCalledWith('abcdefgh');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.notFound).toBe(false);
  });

  it('marks 404 errors as not found', async () => {
    getInvitePreviewMock.mockRejectedValueOnce({ status: 404 });
    const { result } = renderHook(() => useInvitePreview('abcdefgh'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(result.current.notFound).toBe(true);
    expect(result.current.preview).toBeNull();
  });

  it('clears stale timers when the code changes', async () => {
    getInvitePreviewMock.mockResolvedValueOnce(preview({ guildName: 'Next' }));
    const { rerender } = renderHook(({ code }) => useInvitePreview(code), {
      initialProps: { code: 'abcdefgh' },
    });

    rerender({ code: 'ijklmnop' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(getInvitePreviewMock).toHaveBeenCalledOnce();
    expect(getInvitePreviewMock).toHaveBeenCalledWith('ijklmnop');
  });
});
