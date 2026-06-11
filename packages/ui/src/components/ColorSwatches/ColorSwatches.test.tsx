import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ColorSwatches } from './ColorSwatches';

describe('ColorSwatches', () => {
  it('selects predefined and custom colors', () => {
    const onSelect = vi.fn();

    render(
      <ColorSwatches
        colors={['#111111', '#222222']}
        selected="#abcdef"
        onSelect={onSelect}
        showCustomPicker
        customColorLabel="Pick a color"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '#111111' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pick a color' }));
    fireEvent.change(screen.getAllByLabelText('Pick a color')[1], {
      target: { value: '#333333' },
    });

    expect(onSelect).toHaveBeenCalledWith('#111111');
    expect(onSelect).toHaveBeenCalledWith('#333333');
  });

  it('renders without the custom picker', () => {
    render(<ColorSwatches colors={['red']} selected="red" onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'red' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Custom color' })).not.toBeInTheDocument();
  });

  it('uses the fallback picker value when the selected value is not a hex color', () => {
    render(<ColorSwatches colors={['red']} selected="red" onSelect={vi.fn()} showCustomPicker />);

    expect(screen.getAllByLabelText('Custom color')[1]).toHaveValue('#000000');
  });
});
