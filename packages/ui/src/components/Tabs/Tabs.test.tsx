import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('calls onChange with the selected tab id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Tabs
        activeTab="general"
        onChange={onChange}
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'members', label: 'Members' },
        ]}
      />
    );

    const active = screen.getByRole('button', { name: 'General' });
    const inactive = screen.getByRole('button', { name: 'Members' });

    expect(active).toHaveClass('border-primary');
    expect(inactive).toHaveClass('border-transparent');

    await user.click(inactive);

    expect(onChange).toHaveBeenCalledWith('members');
  });
});
