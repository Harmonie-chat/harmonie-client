import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppUpdateButton } from './AppUpdateButton';

describe('AppUpdateButton', () => {
  it('stays hidden outside Tauri', () => {
    render(<AppUpdateButton />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
