import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmojiPickerBase } from './EmojiPickerBase';

vi.mock('emoji-picker-react', () => ({
  default: (props: {
    emojiData: { locale: string };
    height: number;
    searchPlaceholder: string;
    width: number;
  }) => (
    <div data-height={props.height} data-locale={props.emojiData.locale} data-width={props.width}>
      {props.searchPlaceholder}
    </div>
  ),
  Categories: {
    ACTIVITIES: 'activities',
    ANIMALS_NATURE: 'animals',
    FLAGS: 'flags',
    FOOD_DRINK: 'food',
    OBJECTS: 'objects',
    SMILEYS_PEOPLE: 'smileys',
    SUGGESTED: 'suggested',
    SYMBOLS: 'symbols',
    TRAVEL_PLACES: 'travel',
  },
  EmojiStyle: { NATIVE: 'native' },
  SuggestionMode: { RECENT: 'recent' },
}));

vi.mock('emoji-picker-react/dist/data/emojis-fr', () => ({ default: { locale: 'fr' } }));
vi.mock('emoji-picker-react/dist/data/emojis-en', () => ({ default: { locale: 'en' } }));

describe('EmojiPickerBase', () => {
  it('resolves locale data and placeholder aliases', () => {
    document.documentElement.lang = 'fr';

    render(<EmojiPickerBase searchPlaceHolder="Chercher" width={200} height={240} />);

    expect(screen.getByText('Chercher')).toHaveAttribute('data-width', '200');
    expect(screen.getByText('Chercher')).toHaveAttribute('data-height', '240');
    expect(screen.getByText('Chercher')).toHaveAttribute('data-locale', 'fr');
  });

  it('uses explicit emoji data and the primary placeholder prop', () => {
    render(
      <EmojiPickerBase emojiData={{ locale: 'custom' } as never} searchPlaceholder="Find emoji" />
    );

    expect(screen.getByText('Find emoji')).toHaveAttribute('data-locale', 'custom');
    expect(screen.getByText('Find emoji')).toHaveAttribute('data-width', '320');
    expect(screen.getByText('Find emoji')).toHaveAttribute('data-height', '380');
  });

  it('falls back to English locale and default placeholder', () => {
    document.documentElement.lang = '';

    render(<EmojiPickerBase />);

    expect(screen.getByText('Search')).toHaveAttribute('data-locale', 'en');
  });
});
