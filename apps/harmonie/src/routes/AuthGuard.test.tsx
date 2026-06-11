import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';

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
      initialEntries={['/private']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route element={<AuthGuard />}>
          <Route path="/private" element={<div>Private content</div>} />
        </Route>
        <Route path="/auth" element={<div>Authentication page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AuthGuard', () => {
  it('renders child routes for authenticated users', () => {
    authState = { isAuthenticated: true, isInitializing: false };

    renderGuard();

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to auth', () => {
    authState = { isAuthenticated: false, isInitializing: false };

    renderGuard();

    expect(screen.getByText('Authentication page')).toBeInTheDocument();
  });

  it('renders nothing while auth is initializing', () => {
    authState = { isAuthenticated: false, isInitializing: true };

    const { container } = renderGuard();

    expect(container).toBeEmptyDOMElement();
  });
});
