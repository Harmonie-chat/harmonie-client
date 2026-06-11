import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmojiAutocomplete } from './EmojiAutocomplete';

describe('EmojiAutocomplete', () => {
  it('renders nothing without results', () => {
    const { container } = render(
      <EmojiAutocomplete
        results={[]}
        selectedIndex={0}
        pos={{ bottom: 10, left: 10, width: 220 }}
        onSelect={vi.fn()}
        containerRef={createRef<HTMLDivElement>()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders results and selects them on mouse down', () => {
    const onSelect = vi.fn();
    const smile = { emoji: '😀', name: 'grinning' };

    render(
      <EmojiAutocomplete
        results={[smile, { emoji: '✨', name: 'sparkles' }]}
        selectedIndex={1}
        pos={{ bottom: 10, left: 10, width: 220 }}
        onSelect={onSelect}
        containerRef={createRef<HTMLDivElement>()}
      />
    );

    fireEvent.mouseDown(screen.getByRole('button', { name: /grinning/ }));

    expect(screen.getByText(':sparkles:')).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(smile);
  });
});
