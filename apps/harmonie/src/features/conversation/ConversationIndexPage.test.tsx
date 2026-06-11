import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConversationIndexPage } from './ConversationIndexPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => `translated:${key}`,
  }),
}));

describe('ConversationIndexPage', () => {
  it('renders the translated empty conversation placeholder', () => {
    render(<ConversationIndexPage />);

    expect(screen.getByText('translated:conversation.selectPlaceholder')).toBeInTheDocument();
  });
});
