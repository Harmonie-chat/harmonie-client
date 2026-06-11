import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextMentionAutocomplete } from './RichTextMentionAutocomplete';

describe('RichTextMentionAutocomplete', () => {
  it('renders nothing without results', () => {
    const { container } = render(
      <RichTextMentionAutocomplete
        results={[]}
        selectedIndex={0}
        pos={{ bottom: 10, left: 10, width: 240 }}
        onSelect={vi.fn()}
        containerRef={createRef<HTMLDivElement>()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders results and selects on mouse down', () => {
    const onSelect = vi.fn();
    const ada = { userId: '1', username: 'ada', displayName: 'Ada Lovelace' };

    render(
      <RichTextMentionAutocomplete
        results={[ada, { userId: '2', username: 'grace' }]}
        selectedIndex={0}
        pos={{ bottom: 10, left: 10, width: 240 }}
        onSelect={onSelect}
        containerRef={createRef<HTMLDivElement>()}
      />
    );

    fireEvent.mouseDown(screen.getByRole('button', { name: /Ada Lovelace/ }));

    expect(screen.getByText('@ada')).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(ada);
  });
});
