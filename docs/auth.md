# Authentication — Architecture & Implementation

## Overview

The authentication system handles user registration, login, and session persistence across page refreshes. It is built around three concerns:

1. **API layer** — pure fetch functions, no side effects
2. **Token storage** — secure split storage strategy
3. **Auth state** — React context consumed by route guards and pages

---

## File structure

```
apps/harmonie/src/
├── api/
│   ├── auth.ts          # API functions: login, register, refreshTokens
│   ├── authStorage.ts   # Token read/write (memory + localStorage)
│   └── errors.ts        # Shared ApiError interface
├── features/auth/
│   ├── AuthContext.tsx  # AuthProvider + useAuth hook
│   ├── ConnectPage.tsx  # Login page
│   ├── RegisterPage.tsx # Registration page
│   └── AuthCard.tsx     # Shared card layout for auth pages
└── routes/
    ├── AuthGuard.tsx    # Redirects to /auth if not authenticated
    └── GuestGuard.tsx   # Redirects to / if already authenticated
```

---

## Token storage strategy

Access tokens are short-lived JWTs. Refresh tokens are long-lived and used to obtain new access tokens silently.

| Token          | Storage            | Rationale                                                                      |
| -------------- | ------------------ | ------------------------------------------------------------------------------ |
| `accessToken`  | JS module variable | Never persisted — wiped on page reload; not accessible via XSS from other tabs |
| `refreshToken` | `localStorage`     | Persisted across page reloads; used on app init to restore the session         |

### `src/api/authStorage.ts`

```ts
let _accessToken: string | null = null;

export const storeTokens = ({ accessToken, refreshToken }: TokensPayload) => {
  _accessToken = accessToken;
  localStorage.setItem('refreshToken', refreshToken);
};

export const getAccessToken = () => _accessToken;
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const clearTokens = () => {
  _accessToken = null;
  localStorage.removeItem('refreshToken');
};
```

---

## API layer

### `src/api/auth.ts`

Pure fetch functions — no React, no side effects. The base URL is read from the `VITE_API_BASE_URL` environment variable (must be prefixed with `VITE_` to be exposed to the Vite client bundle).

```
VITE_API_BASE_URL=http://localhost:5001/api   # .env
```

#### Endpoints

| Function          | Method | Endpoint         |
| ----------------- | ------ | ---------------- |
| `login()`         | POST   | `/auth/login`    |
| `register()`      | POST   | `/auth/register` |
| `refreshTokens()` | POST   | `/auth/refresh`  |

All functions throw the raw JSON body on non-2xx responses (cast to `ApiError` at the call site).

### `src/api/errors.ts`

```ts
export interface ApiError {
  code: string;
  detail: string;
  errors: Record<string, { code: string; detail: string }[]> | null;
  status: number;
  traceId: string;
}
```

---

## Auth context

### `src/features/auth/AuthContext.tsx`

Provides global auth state and initializes the session on app startup.

```ts
interface AuthContextValue {
  isAuthenticated: boolean;
  isInitializing: boolean;
  setIsAuthenticated: (value: boolean) => void;
}
```

#### Session restoration on mount

On first render, `AuthProvider` reads the `refreshToken` from localStorage and silently calls `POST /auth/refresh`. If successful, the new tokens are stored and `isAuthenticated` is set to `true`.

`isInitializing` stays `true` until this check completes — route guards render nothing while waiting, preventing a flash of the login page for authenticated users.

#### React StrictMode guard

React StrictMode mounts effects twice in development. Since token refresh uses **token rotation** (each refresh invalidates the previous token), a naive implementation would trigger `AUTH_REFRESH_TOKEN_REUSE_DETECTED` on the second call.

This is prevented with a `useRef` flag:

```ts
const initialized = useRef(false);

useEffect(() => {
  if (initialized.current) return;
  initialized.current = true;
  // ... refresh logic
}, []);
```

#### Fatal vs non-fatal refresh errors

Tokens are only cleared when the backend signals an unrecoverable state. Network errors and server errors (5xx) are ignored — the user is simply left unauthenticated without wiping their stored refresh token.

```ts
const FATAL_REFRESH_CODES = new Set([
  'AUTH_INVALID_REFRESH_TOKEN',
  'AUTH_REFRESH_TOKEN_REUSE_DETECTED',
  'AUTH_USER_INACTIVE',
]);

// In catch:
if (FATAL_REFRESH_CODES.has(apiError?.code)) clearTokens();
```

---

## Route guards

Both guards live in `src/routes/` and wrap route trees via React Router's `<Outlet />`.

### `AuthGuard`

Protects authenticated routes. Redirects to `/auth` if not logged in.

```ts
export const AuthGuard = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <Outlet />;
};
```

### `GuestGuard`

Protects guest-only routes (login, register). Redirects to `/` if already logged in.

```ts
export const GuestGuard = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
};
```

---

## Routing

```
/auth                 → GuestGuard
  /auth               → redirect to /auth/connect
  /auth/connect       → ConnectPage  (login)
  /auth/register      → RegisterPage (registration)

/                     → AuthGuard
  /                   → AppLayout + nested app routes

*                     → redirect to /
```

---

## Auth pages

### ConnectPage (login)

- Fields: `emailOrUsername` (accepts both) + `password`
- On success: calls `storeTokens()`, sets `isAuthenticated(true)`, navigates to `/`
- Error mapping:

| API error code             | i18n key             |
| -------------------------- | -------------------- |
| `AUTH_INVALID_CREDENTIALS` | `invalidCredentials` |
| `AUTH_USER_INACTIVE`       | `userInactive`       |
| _(any other)_              | `genericError`       |

### RegisterPage

- Fields: `username` + `email` + `password`
- On success: calls `storeTokens()`, sets `isAuthenticated(true)`, navigates to `/`
- Error mapping:

| API error code            | i18n key            | Target field   |
| ------------------------- | ------------------- | -------------- |
| `AUTH_DUPLICATE_EMAIL`    | `duplicateEmail`    | email field    |
| `AUTH_DUPLICATE_USERNAME` | `duplicateUsername` | username field |
| _(any other)_             | `genericError`      | form-level     |

---

## Provider tree

`AuthProvider` wraps the entire router in `main.tsx` so auth state is available to all routes including guards:

```tsx
<StrictMode>
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
</StrictMode>
```

---

## Environment variables

```
# apps/harmonie/.env
VITE_API_BASE_URL=http://localhost:5001/api
```

TypeScript support for `import.meta.env` is enabled via `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```
