import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox } from './Combobox';

describe('Combobox', () => {
  it('renders header, search input, item details, and selects values', () => {
    const onSearchChange = vi.fn();
    const onSelect = vi.fn();

    render(
      <Combobox
        header="People"
        searchValue="ad"
        searchPlaceholder="Search people"
        onSearchChange={onSearchChange}
        onSelect={onSelect}
        autoFocusSearch
        align="right"
        placement="top"
        items={[
          {
            value: 'ada',
            label: 'Ada',
            description: 'Online',
            icon: <span aria-hidden="true">A</span>,
          },
        ]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search people'), {
      target: { value: 'ada' },
    });
    fireEvent.mouseDown(screen.getByRole('button', { name: /Ada/ }));
    fireEvent.click(screen.getByRole('button', { name: /Ada/ }));

    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(onSearchChange).toHaveBeenCalledWith('ada');
    expect(onSelect).toHaveBeenCalledWith('ada');
  });

  it('renders an empty state without search controls', () => {
    render(<Combobox items={[]} onSelect={vi.fn()} emptyMessage="No result" />);

    expect(screen.getByText('No result')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders simple bottom-left items and a controlled empty search value', () => {
    const onSelect = vi.fn();
    const onSearchChange = vi.fn();

    render(
      <Combobox
        className="custom-combobox"
        items={[{ value: 'plain', label: 'Plain item' }]}
        onSelect={onSelect}
        onSearchChange={onSearchChange}
      />
    );

    const option = screen.getByRole('button', { name: 'Plain item' });

    expect(option).toHaveClass('px-3', 'py-1.5');
    expect(option.querySelector('.text-text-3')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');

    fireEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith('plain');
  });
});
