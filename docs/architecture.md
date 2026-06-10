# Harmonie — Project Architecture

## Overview

Harmonie is a monorepo containing two workspaces:

| Workspace       | npm name        | Role                                     |
| --------------- | --------------- | ---------------------------------------- |
| `apps/harmonie` | `@harmonie/app` | Main React application                   |
| `packages/ui`   | `@harmonie/ui`  | Design system: UI components + Storybook |

---

## Tech stack

| Tool                | Usage                                                |
| ------------------- | ---------------------------------------------------- |
| **pnpm**            | Package manager + workspaces                         |
| **Turborepo**       | Monorepo task orchestration (build, dev, lint)       |
| **Vite**            | Bundler (SPA mode for app, library mode for UI)      |
| **React 19**        | UI framework                                         |
| **TypeScript 5**    | Static typing                                        |
| **Tailwind CSS v4** | Styling — used in `packages/ui` and `apps/harmonie`  |
| **Storybook 10.4**  | Component development and documentation in isolation |
| **React Router v6** | Client-side routing                                  |
| **SignalR**         | Realtime application events                          |
| **LiveKit**         | Voice and video rooms                                |
| **i18next**         | Application internationalization                     |

---

## Folder structure

```
harmonie-client/
├── package.json              # Workspace root — Turborepo scripts
├── pnpm-workspace.yaml       # pnpm workspaces declaration
├── turbo.json                # Turborepo pipeline
├── .npmrc                    # pnpm configuration
├── docs/
│   ├── architecture.md       # This file
│   └── auth.md               # Authentication architecture
├── apps/
│   └── harmonie/             # Main application
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── main.tsx          # Entry point — mounts app providers + RouterProvider
│           ├── vite-env.d.ts     # Vite env types (import.meta.env)
│           ├── api/
│           │   ├── auth.ts
│           │   ├── channels.ts
│           │   ├── client.ts
│           │   ├── conversations.ts
│           │   ├── files.ts
│           │   ├── guilds.ts
│           │   └── users.ts
│           ├── routes/
│           │   ├── index.tsx     # createBrowserRouter
│           │   ├── AuthGuard.tsx # Redirects to /auth if not authenticated
│           │   └── GuestGuard.tsx# Redirects to / if authenticated
│           ├── layouts/
│           │   ├── MainLayout.tsx
│           │   ├── MainLayoutShell.tsx
│           │   ├── ConversationsLayout.tsx
│           │   └── GuildLayout.tsx
│           ├── features/
│               ├── auth/
│               │   ├── AuthContext.tsx   # AuthProvider + useAuth hook
│               │   ├── AuthCard.tsx      # Shared card layout for auth pages
│               │   ├── ConnectPage.tsx   # Login page
│               │   └── RegisterPage.tsx  # Registration page
│               ├── channel/              # Guild channel navigation and text channels
│               ├── conversation/         # Direct conversations and calls
│               ├── guild/                # Guild workspace, search, invites, settings, members
│               ├── realtime/             # SignalR connection and activity contexts
│               └── user/                 # Profile, settings, audio/video device state
│           ├── shared/
│           │   ├── components/
│           │   ├── hooks/
│           │   ├── members/
│           │   ├── message/
│           │   ├── notifications/
│           │   ├── pwa/
│           │   ├── utils/
│           │   ├── viewport/
│           │   └── voice/                # Shared LiveKit voice UI and hooks
│           ├── i18n/
│           ├── styles/
│           └── types/
└── packages/
    └── ui/                   # Design system
        ├── package.json
        ├── vite.config.ts    # Library mode — externalizes React
        ├── tsconfig.json
        ├── .storybook/
        │   ├── main.ts
        │   ├── preview.tsx
        │   └── preview-head.html  # Google Fonts injection
        └── src/
            ├── index.ts      # Barrel export of all components
            ├── hooks/
            ├── styles/
            └── components/
                └── [ComponentName]/
                    ├── ComponentName.tsx
                    └── ComponentName.stories.tsx
```

---

## Tailwind CSS

Tailwind v4 is used in both workspaces with a CSS-first approach — no `tailwind.config.ts`.

### Setup in `packages/ui`

- `src/styles/index.css` — `@import "tailwindcss"` + `@theme {}` with all Harmonie design tokens

### Setup in `apps/harmonie`

- `src/styles/index.css` — imports the UI package styles to inherit all tokens

### Component styling convention

Design system components use Tailwind classes directly in JSX. For complex variants, `clsx` or `cva` (class-variance-authority) is used:

```tsx
// Button example
<button className={clsx(
  'inline-flex items-center font-medium rounded-lg transition-opacity',
  variant === 'primary' && 'bg-primary text-primary-fg',
  variant === 'ghost' && 'border border-border-2 text-text-1',
)}>
```

---

## UI components (`packages/ui`)

### Folder convention

Each component lives in its own folder:

```
src/components/Button/
├── Button.tsx          # React component + exported types
└── Button.stories.tsx  # Storybook stories
```

All dumb/presentational components live in `packages/ui`. The app never defines its own UI primitives. New components must include a colocated Storybook story.

### Exports

`src/index.ts` exports all components and their types from their component files:

```ts
export { Button } from './components/Button/Button';
export type { ButtonProps } from './components/Button/Button';
```

---

## Application (`apps/harmonie`)

### Routing (React Router v6)

```
/auth                → GuestGuard (redirects to / if authenticated)
  /auth              → redirect to /auth/connect
  /auth/connect      → ConnectPage  (login)
  /auth/register     → RegisterPage (registration)

/                    → AuthGuard (redirects to /auth if not authenticated)
  /                  → MainLayout
    /                → redirect to /conversations
    /conversations   → ConversationsLayout + ConversationIndexPage
    /conversations/:conversationId
                     → ConversationsLayout + ConversationView
    /guilds/:guildId → GuildLayout + ChannelIndexPage
    /guilds/:guildId/channels/:channelId
                     → GuildLayout + TextChannelView
    /guilds/:guildId/voice/:channelId
                     → GuildLayout + VoiceChannelView

*                    → redirect to /
```

### Feature folders

Each feature folder is self-contained and owns its pages, hooks, and components:

```
features/auth/          → auth pages + AuthContext (useAuth hook + AuthProvider)
features/channel/       → guild channels, channel sidebar, text channel views
features/conversation/  → direct conversations, conversation call views and creation
features/guild/         → guild workspace, search, invites, settings, members
features/realtime/      → SignalR provider and realtime message activity state
features/user/          → profile, settings, theme, audio/video device preferences
shared/message/         → reusable message rendering, composer, attachments, reactions
shared/voice/           → shared LiveKit voice room UI, hooks, and utilities
```

Route guards (`AuthGuard`, `GuestGuard`) live in `routes/` rather than `features/auth/` since they are routing concerns, not feature concerns.

See [`docs/auth.md`](./auth.md) for the full authentication architecture.

### Consuming the design system

```ts
import { Button, Input } from '@harmonie/ui';
```

---

## Dev commands

```bash
# Install dependencies (links workspaces)
pnpm install

# Start all servers in parallel
pnpm dev

# Start Storybook only
pnpm --filter @harmonie/ui storybook

# Start the app only
pnpm --filter @harmonie/app dev

# Build all packages
pnpm build

# Build the design system only
pnpm --filter @harmonie/ui build

# Build the app only
pnpm --filter @harmonie/app build
```
