import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GuestGuard } from './GuestGuard';

let authState = {
  isAuthenticated: false,
  isInitializing: false,
};

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderGuard = () =>
  render(
    <MemoryRouter
      initialEntries={['/auth']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route element={<GuestGuard />}>
          <Route path="/auth" element={<div>Guest content</div>} />
        </Route>
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('GuestGuard', () => {
  it('renders child routes for guests', () => {
    authState = { isAuthenticated: false, isInitializing: false };

    renderGuard();

    expect(screen.getByText('Guest content')).toBeInTheDocument();
  });

  it('redirects authenticated users to home', () => {
    authState = { isAuthenticated: true, isInitializing: false };

    renderGuard();

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('renders nothing while auth is initializing', () => {
    authState = { isAuthenticated: false, isInitializing: true };

    const { container } = renderGuard();

    expect(container).toBeEmptyDOMElement();
  });
});
