# Harmonie — Roadmap

## Phase 1 — Documentation ✅
- [x] `docs/architecture.md` — architecture générale du projet
- [x] `docs/roadmap.md` — ce fichier

---

## Phase 2 — Monorepo setup
Mettre en place la structure du monorepo sans aucun code applicatif.

- [ ] `package.json` root (scripts Turborepo : `dev`, `build`, `storybook`)
- [ ] `pnpm-workspace.yaml`
- [ ] `turbo.json` (pipeline : `build → ^build`, `dev` et `storybook` persistants)
- [ ] `.npmrc` (`auto-install-peers=true`)
- [ ] Mettre à jour `.gitignore` (`apps/harmonie/` en remplacement de `apps/harmonie-web/`, `packages/ui/dist/`)
- [ ] `pnpm install` — vérifie que les workspaces se lient correctement

---

## Phase 3 — Package `packages/ui` (structure + Storybook)
Créer le package du design system, vide mais fonctionnel avec Storybook.

- [ ] `packages/ui/package.json` (nom `@harmonie/ui`, React en `peerDependencies`)
- [ ] `packages/ui/vite.config.ts` (library mode, externalize React, `vite-plugin-dts`)
- [ ] `packages/ui/tsconfig.json`
- [ ] Tailwind CSS v4 dans `packages/ui` (`tailwind.config.ts` avec preset)
- [ ] `.storybook/main.ts`, `preview.ts`, `preview-head.html` (Google Fonts)
- [ ] `src/index.ts` barrel export vide
- [ ] Vérification : `pnpm --filter @harmonie/ui storybook` démarre sur le port 6006

---

## Phase 4 — Package `apps/harmonie` (structure + app vide)
Créer l'application React, vide mais fonctionnelle, connectée au design system.

- [ ] `apps/harmonie/package.json` (nom `@harmonie/app`, dépendance `@harmonie/ui: workspace:*`, React Router v6)
- [ ] `apps/harmonie/vite.config.ts` (alias `@/` → `src/`)
- [ ] `apps/harmonie/tsconfig.json`
- [ ] `apps/harmonie/index.html` (Google Fonts `<link>`)
- [ ] Tailwind CSS v4 dans `apps/harmonie` (étend le preset de `@harmonie/ui`)
- [ ] `src/main.tsx` + `src/App.tsx` minimalistes
- [ ] Vérification : `pnpm --filter @harmonie/app dev` démarre sur le port 5173

---

## Phase 5 — Routing et layout de l'application
Mettre en place la structure de navigation sans contenu.

- [ ] `src/routes/index.tsx` — `createBrowserRouter` avec toutes les routes
- [ ] `src/layouts/AppLayout.tsx` — grille 3 colonnes (ServerRail + GuildSidebar + `<Outlet />`)
- [ ] Pages vides : `AuthPage`, `GuildSelectorPage`, `ChatPage`, `VoicePage`
- [ ] Vérification : navigation entre les pages fonctionne

---

## Phase 6 — Composants UI (design system)
Implémenter les composants dans `packages/ui`, un par un, chacun avec sa story Storybook.

> À planifier en détail lors de cette phase.

---

## Phase 7 — Fonctionnalités de l'application
Assembler les pages de l'app en utilisant les composants du design system.

> À planifier en détail lors de cette phase.
