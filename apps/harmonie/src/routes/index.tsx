import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthGuard } from './AuthGuard';
import { GuestGuard } from './GuestGuard';
import { ConnectPage } from '../features/auth/ConnectPage';
import { RegisterPage } from '../features/auth/RegisterPage';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <GuestGuard />,
    children: [
      {
        index: true,
        element: <Navigate to="/auth/connect" replace />,
      },
      {
        path: 'connect',
        element: <ConnectPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
