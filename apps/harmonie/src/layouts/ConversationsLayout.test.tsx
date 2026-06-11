import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConversationsLayout } from './ConversationsLayout';

vi.mock('@/features/conversation/ConversationSidebar', () => ({
  ConversationSidebar: () => <aside>Conversation sidebar</aside>,
}));

vi.mock('./MainLayoutShell', () => ({
  MainLayoutShell: ({
    sidebar,
    showSidepanels,
  }: {
    sidebar: ReactNode;
    showSidepanels?: boolean;
  }) => (
    <div data-show-sidepanels={String(showSidepanels)}>
      <span>Main shell</span>
      {sidebar}
    </div>
  ),
}));

describe('ConversationsLayout', () => {
  it('renders the conversation sidebar without guild sidepanels', () => {
    render(<ConversationsLayout />);

    expect(screen.getByText('Main shell').parentElement).toHaveAttribute(
      'data-show-sidepanels',
      'false'
    );
    expect(screen.getByText('Conversation sidebar')).toBeInTheDocument();
  });
});
