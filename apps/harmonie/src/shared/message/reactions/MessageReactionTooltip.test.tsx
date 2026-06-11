import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MessageReactionTooltip } from './MessageReactionTooltip';

const reaction = {
  emoji: '👍',
  count: 2,
  reactedByMe: false,
};

describe('MessageReactionTooltip', () => {
  it('renders a passive tooltip with the empty label', async () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();

    render(
      <MessageReactionTooltip
        id="reaction-tooltip"
        reaction={reaction}
        users={[]}
        style={{ left: 10, top: 20 }}
        sentence="Alice and Bob reacted"
        emptyLabel="No reactions yet"
        canOpenDetails={false}
        onOpenDetails={vi.fn()}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('👍');
    expect(tooltip).toHaveTextContent('No reactions yet');

    await userEvent.hover(tooltip);
    await userEvent.unhover(tooltip);

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('renders an actionable tooltip and opens reaction details', async () => {
    const onOpenDetails = vi.fn();

    render(
      <MessageReactionTooltip
        id="reaction-details-tooltip"
        reaction={reaction}
        users={[{ userId: 'u1', username: 'alice', displayName: 'Alice' }]}
        style={{ left: 10, top: 20 }}
        sentence="Alice reacted"
        emptyLabel="No reactions yet"
        canOpenDetails
        onOpenDetails={onOpenDetails}
        onMouseEnter={vi.fn()}
        onMouseLeave={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Alice reacted/ }));

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
  });

  it('renders sentence text for passive tooltips with users', () => {
    render(
      <MessageReactionTooltip
        id="passive-reaction-details-tooltip"
        reaction={reaction}
        users={[{ userId: 'u1', username: 'alice', displayName: 'Alice' }]}
        style={{ left: 10, top: 20 }}
        sentence="Alice reacted"
        emptyLabel="No reactions yet"
        canOpenDetails={false}
        onOpenDetails={vi.fn()}
        onMouseEnter={vi.fn()}
        onMouseLeave={vi.fn()}
      />
    );

    expect(screen.getByRole('tooltip')).toHaveTextContent('Alice reacted');
  });

  it('renders the empty label for actionable tooltips without users', () => {
    render(
      <MessageReactionTooltip
        id="actionable-empty-reaction-tooltip"
        reaction={reaction}
        users={[]}
        style={{ left: 10, top: 20 }}
        sentence="Alice reacted"
        emptyLabel="No reactions yet"
        canOpenDetails
        onOpenDetails={vi.fn()}
        onMouseEnter={vi.fn()}
        onMouseLeave={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /No reactions yet/ })).toBeInTheDocument();
  });
});
