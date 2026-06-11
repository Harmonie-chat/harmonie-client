import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LayoutSync } from './LayoutSync';

const { useDocumentTitleSyncMock, useNotificationNavigationSyncMock } = vi.hoisted(() => ({
  useDocumentTitleSyncMock: vi.fn(),
  useNotificationNavigationSyncMock: vi.fn(),
}));

vi.mock('@/shared/hooks/useDocumentTitleSync', () => ({
  useDocumentTitleSync: useDocumentTitleSyncMock,
}));

vi.mock('@/shared/hooks/useNotificationNavigationSync', () => ({
  useNotificationNavigationSync: useNotificationNavigationSyncMock,
}));

describe('LayoutSync', () => {
  it('runs global layout synchronization hooks and renders nothing', () => {
    const { container } = render(<LayoutSync />);

    expect(useDocumentTitleSyncMock).toHaveBeenCalledOnce();
    expect(useNotificationNavigationSyncMock).toHaveBeenCalledOnce();
    expect(container).toBeEmptyDOMElement();
  });
});
