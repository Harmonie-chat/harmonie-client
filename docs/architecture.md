# Harmonie — Architecture du projet

## Vue d'ensemble

Harmonie est un monorepo contenant deux workspaces :

| Workspace | Nom npm | Rôle |
|---|---|---|
| `apps/harmonie` | `@harmonie/app` | Application React principale |
| `packages/ui` | `@harmonie/ui` | Design system : composants UI + Storybook |

---

## Stack technique

| Outil | Usage |
|---|---|
| **pnpm** | Gestionnaire de paquets + workspaces |
| **Turborepo** | Orchestration des tâches du monorepo (build, dev, lint) |
| **Vite** | Bundler (app en mode SPA, UI en mode librairie) |
| **React 18** | Framework UI |
| **TypeScript 5** | Typage statique |
| **Tailwind CSS v4** | Styling — utilisé dans `packages/ui` et `apps/harmonie` |
| **Storybook 8** | Développement et documentation des composants en isolation |
| **React Router v6** | Routage côté client de l'application |

---

## Structure des dossiers

```
harmonie-client/
├── package.json              # Workspace root — scripts Turborepo
├── pnpm-workspace.yaml       # Déclaration des workspaces pnpm
├── turbo.json                # Pipeline Turborepo
├── .npmrc                    # Configuration pnpm
├── docs/
│   └── architecture.md       # Ce fichier
├── apps/
│   └── harmonie/             # Application principale
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── main.tsx          # Point d'entrée
│           ├── App.tsx
│           ├── routes/
│           │   ├── index.tsx     # createBrowserRouter
│           │   ├── AuthPage.tsx
│           │   ├── GuildSelectorPage.tsx
│           │   ├── ChatPage.tsx
│           │   └── VoicePage.tsx
│           ├── layouts/
│           │   └── AppLayout.tsx # Grille 3 colonnes + <Outlet />
│           └── features/
│               ├── auth/
│               ├── chat/
│               ├── sidebar/
│               ├── voice/
│               └── guild/
└── packages/
    └── ui/                   # Design system
        ├── package.json
        ├── vite.config.ts    # Mode librairie — externalise React
        ├── tsconfig.json
        ├── .storybook/
        │   ├── main.ts
        │   ├── preview.ts
        │   └── preview-head.html  # Injection Google Fonts
        └── src/
            ├── index.ts      # Barrel export de tous les composants
            └── components/
                └── [NomComposant]/
                    ├── NomComposant.tsx
                    ├── NomComposant.stories.tsx
                    └── index.ts
```

---

## Tailwind CSS

Tailwind v4 est utilisé dans les deux workspaces. La configuration est partagée via un preset défini dans `packages/ui` et étendu par l'app.

### Setup dans `packages/ui`

- `tailwind.config.ts` — définit le preset (couleurs, typographie, spacing, etc.)
- Tailwind est configuré via `@import "tailwindcss"` dans le CSS d'entrée du package

### Setup dans `apps/harmonie`

- `tailwind.config.ts` — étend le preset de `@harmonie/ui`
- Tailwind est configuré via `@vite-plugin-tailwindcss` ou l'intégration Vite native de Tailwind v4

### Convention de style des composants

Les composants du design system utilisent des classes Tailwind directement dans le JSX. Pour les variantes complexes, `clsx` (ou `cva` — class-variance-authority) est utilisé pour composer les classes conditionnellement.

```tsx
// Exemple Button
<button className={clsx(
  'inline-flex items-center font-medium rounded-lg transition-opacity',
  variant === 'primary' && 'bg-sage-dark text-white',
  variant === 'ghost' && 'border border-border text-text-mid',
)}>
```

---

## Composants UI (`packages/ui`)

### Convention par dossier

Chaque composant vit dans son propre dossier :

```
src/components/Button/
├── Button.tsx          # Composant React + types exportés
├── Button.stories.tsx  # Stories Storybook
└── index.ts            # Re-export public : export { Button } from './Button'
```

### Exports

Le fichier `src/index.ts` exporte tous les composants et leurs types :

```ts
export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'
// ...
```

---

## Application (`apps/harmonie`)

### Routing (React Router v6)

```
/auth                                    → AuthPage
/                                        → AppLayout
  /                                      → GuildSelectorPage
  /:serverId/:guildId/channel/:channelId → ChatPage
  /:serverId/:guildId/voice/:channelId   → VoicePage
```

### Layout principal

`AppLayout` est une grille CSS 3 colonnes :

```
┌──────┬────────────────┬─────────────────────────────┐
│      │                │                             │
│Server│  Guild sidebar │     <Outlet />              │
│ Rail │  (channels,    │     (ChatPage, VoicePage,   │
│      │   user panel)  │      GuildSelectorPage)     │
│      │                │                             │
└──────┴────────────────┴─────────────────────────────┘
```

### Consommation du design system

```ts
// src/features/auth/AuthForm.tsx
import { Button, Input } from '@harmonie/ui'
```

---

## Commandes de développement

```bash
# Installer les dépendances (lie les workspaces)
pnpm install

# Lancer tous les serveurs en parallèle
turbo run dev

# Lancer uniquement Storybook
pnpm --filter @harmonie/ui storybook

# Lancer uniquement l'application
pnpm --filter @harmonie/app dev

# Builder tous les packages
turbo run build

# Builder uniquement le design system
pnpm --filter @harmonie/ui build
```

---

## Décisions architecturales

### Pourquoi Turborepo + pnpm ?
Turborepo gère l'ordre des builds (le design system doit builder avant l'app) et met en cache les résultats. pnpm workspaces offre un `node_modules` strict et le protocole `workspace:*` pour les dépendances locales.

### Pourquoi Tailwind v4 ?
Tailwind v4 est la version courante. Son approche CSS-first s'intègre naturellement avec Vite. Le preset partagé entre `packages/ui` et `apps/harmonie` garantit la cohérence des tokens visuels dans tout le projet.

### Pourquoi Storybook séparé de l'app ?
Storybook vit exclusivement dans `packages/ui`, ce qui force à développer les composants indépendamment de l'app. Cela garantit que le design system est réutilisable et non couplé à la logique métier.

### Pourquoi Vite en mode librairie pour `packages/ui` ?
Vite en mode librairie produit un bundle ES optimisé sans dupliquer React (externalisé). `vite-plugin-dts` génère les déclarations TypeScript.
