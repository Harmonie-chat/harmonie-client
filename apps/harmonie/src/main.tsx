import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/index.css';
import './i18n';
import { router } from './routes';
import { AuthProvider } from './features/auth/AuthContext';
import { UserProvider } from './features/user/UserContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </AuthProvider>
  </StrictMode>
);
