# Harmonie client

[![License: MIT + Commons Clause](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue)](./LICENSE)

[![🚀 CI - Checks & Build](https://github.com/Harmonie-chat/harmonie-client/actions/workflows/ci.yml/badge.svg)](https://github.com/Harmonie-chat/harmonie-client/actions/workflows/ci.yml)

Web client for Harmonie, a **text and voice chat** application.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10.34.1

```bash
npm install -g pnpm@10.34.1
```

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Harmonie-chat/harmonie-client.git
cd harmonie-client
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp apps/harmonie/.env.example apps/harmonie/.env
```

Edit `apps/harmonie/.env` and set the URLs to match your backend:

| Variable               | Default                               | Description                                                 |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `VITE_API_BASE_URL`    | `http://localhost:5001/api`           | REST API base URL                                           |
| `VITE_WS_BASE_URL`     | `http://localhost:5001/hubs/realtime` | SignalR WebSocket URL                                       |
| `VITE_TURN_URLS`       | _(optional)_                          | TURN relay URLs for voice (required on restricted networks) |
| `VITE_TURN_USERNAME`   | _(optional)_                          | TURN username                                               |
| `VITE_TURN_CREDENTIAL` | _(optional)_                          | TURN credential                                             |

### 4. Start the development server

```bash
pnpm dev
```

This starts all workspaces in parallel via Turborepo:

| Service               | URL                   |
| --------------------- | --------------------- |
| App (`apps/harmonie`) | http://localhost:5173 |

## Available commands

Run from the root of the monorepo:

```bash
pnpm dev            # Start all dev servers
pnpm build          # Build all packages and apps
pnpm lint           # Lint all workspaces
pnpm format         # Format code with Prettier
pnpm format:check   # Check formatting without writing
pnpm storybook      # Start Storybook for the UI package (http://localhost:6006)
```

### Building the UI library

The `packages/ui` library must be built before the app can consume it. Turborepo handles this automatically when you run `pnpm build` from the root, but you can also build it in isolation:

```bash
# Build the UI library only
pnpm --filter @harmonie/ui run build
```

> **Note:** if you add or modify a component in `packages/ui` and the app does not pick up the changes during `pnpm dev`, run the build command above once to regenerate the package output.

## Project structure

```
harmonie-client/
├── apps/
│   └── harmonie/        # Main React application (Vite + Tailwind CSS)
└── packages/
    └── ui/              # Shared component library (@harmonie/ui) + Storybook
```

## Tech stack

- **React 19** + **TypeScript 5** + **Vite 5**
- **Tailwind CSS v4** (CSS-first configuration)
- **React Router v6**
- **SignalR** for real-time messaging
- **LiveKit** for voice/video channels
- **pnpm 10 workspaces** + **Turborepo**

## License

MIT License with Commons Clause (non-commercial use only). See [LICENSE](./LICENSE).
