import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageSelector } from './LanguageSelector';

describe('LanguageSelector', () => {
  it('opens, selects a language, marks the current language and closes on outside click', () => {
    const onChange = vi.fn();

    render(
      <LanguageSelector
        currentLang="fr"
        onChange={onChange}
        languages={[
          { code: 'fr', label: 'Français' },
          { code: 'en', label: 'English' },
        ]}
      />
    );

    const toggle = screen.getByRole('button', { name: 'Français' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('button', { name: 'Français' })[1]).toHaveAttribute(
      'aria-current',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(onChange).toHaveBeenCalledWith('en');
    expect(screen.queryByRole('button', { name: 'English' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'English' })).not.toBeInTheDocument();
  });

  it('handles an unknown current language', () => {
    render(
      <LanguageSelector
        currentLang="es"
        onChange={vi.fn()}
        languages={[{ code: 'fr', label: 'Français' }]}
      />
    );

    expect(screen.getByRole('button', { name: 'ES' })).toHaveTextContent('ES');
  });
});
