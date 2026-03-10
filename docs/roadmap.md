# Plan — User profile + main layout + roadmap

## Context

Auth (login/register) est fonctionnel. Cette phase construit :
1. Un `apiFetch` centralisé qui gère automatiquement le 401 (refresh → replay ou déconnexion)
2. `GET /api/users/me` → UserContext (avatar, username dans le UserPanel)
3. `GET /api/guilds` → guild sidebar avec vraies données
4. `GET /api/guilds/:id/channels` → channel sidebar avec vraies données
5. Le `MainLayout` 3 colonnes (renommé depuis `AppLayout`)
6. `docs/roadmap.md` — roadmap complète du projet

---

## Architecture des composants

```
MainLayout (CSS shell uniquement — flex h-screen)
├── GuildSidebar    (s'auto-alimente via listGuilds())
├── ChannelSidebar  (lit guildId via useParams, s'auto-alimente via listChannels())
│   └── UserPanel  (lit depuis UserContext)
└── <Outlet />     (contenu principal — vide pour cette phase)
```

`MainLayout` ne contient aucune logique ni fetch — juste la structure CSS.
 
---

## Routing

```
/ → AuthGuard → MainLayout (Outlet)
  index → empty state (panel gris)
  /guilds/:guildId → ChannelSidebar active pour ce guild
    index → empty channel view
    /channels/:channelId → (phase suivante)
    /voice/:channelId    → (phase suivante)
```
 
---

## Fichiers à créer / modifier

### `apps/harmonie/src/api/client.ts` — nouveau

`apiFetch(input, init)` : wrapper autour de `fetch` qui :
- Ajoute `Authorization: Bearer {accessToken}` automatiquement
- Sur 401 : tente le refresh token (via `refreshTokens()`)
  - Si refresh OK → rejoue la requête originale
  - Si refresh KO → appelle `onLogout()` (clear tokens + `setIsAuthenticated(false)` + redirect `/auth/connect`)
- Lock anti-double-refresh : un seul `refreshPromise` partagé pour éviter les appels parallèles
- `setLogoutHandler(fn)` exporté pour que `AuthProvider` l'enregistre au montage

```ts
// Pseudo-code de la mécanique
let refreshPromise: Promise<void> | null = null;
 
export const apiFetch = async (input, init) => {
  const res = await fetch(input, withBearer(init));
  if (res.status !== 401) return res;
  // refresh lock
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => refreshPromise = null);
  }
  await refreshPromise;
  return fetch(input, withBearer(init)); // replay
};
```

Note : les erreurs 401 sur `/auth/refresh` lui-même ne doivent pas déclencher un nouveau refresh (boucle infinie) → guard sur l'URL.
 
---

### `apps/harmonie/src/api/users.ts` — nouveau

```ts
export interface UserProfile {
  userId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}
export const getMe = (): Promise<UserProfile> => apiFetch(`${API_BASE}/users/me`).then(r => r.json());
```
 
---

### `apps/harmonie/src/api/guilds.ts` — nouveau

```ts
export interface Guild { guildId, name, ownerUserId, role, joinedAtUtc }
export interface Channel { channelId, name, type: 'Text' | 'Voice', isDefault, position }
export interface ChannelList { guildId, channels: Channel[] }
 
export const listGuilds = (): Promise<{ guilds: Guild[] }>
export const listChannels = (guildId: string): Promise<ChannelList>
export const createGuild = (name: string): Promise<...>
```
 
---

### `apps/harmonie/src/features/user/UserContext.tsx` — nouveau

- `UserProvider` : observe `isAuthenticated`, appelle `getMe()` quand il passe à `true`, reset à `null` quand il passe à `false`
- `useUser()` → `{ user: UserProfile | null, isLoading: boolean }`
- Monté dans `main.tsx` comme enfant de `AuthProvider`

---

### `apps/harmonie/src/features/auth/AuthContext.tsx` — modifié

Ajouter dans `AuthProvider` :
```tsx
useEffect(() => {
  setLogoutHandler(() => {
    clearTokens();
    setIsAuthenticated(false);
  });
}, []);
```
 
---

### `apps/harmonie/src/layouts/MainLayout.tsx` — renommé depuis `AppLayout.tsx`

```tsx
export const MainLayout = () => (
  <div className="flex h-screen overflow-hidden bg-background">
    <GuildSidebar />
    <ChannelSidebar />
    <main className="flex-1 overflow-hidden">
      <Outlet />
    </main>
  </div>
);
```
 
---

### `apps/harmonie/src/features/guild/GuildSidebar.tsx` — nouveau

- Appelle `listGuilds()` au montage
- Liste verticale d'icônes guilds (initiales du nom dans un carré arrondi coloré, en attendant les vraies images)
- Active state : highlight sur le guild dont l'id est dans `useParams().guildId`
- Click → navigate(`/guilds/${guildId}`)
- Bouton `+` en bas (`Plus` icon lucide) pour créer une guild (modal ou route, à décider)

---

### `apps/harmonie/src/features/channel/ChannelSidebar.tsx` — nouveau

- Lit `guildId` depuis `useParams()`
- Appelle `listChannels(guildId)` quand `guildId` change
- Affiche le nom de la guild en header
- Sépare les channels par type : section "Salons textuels" (`Hash` icon) + "Salons vocaux" (`Volume2` icon)
- Click channel → navigate(`/guilds/${guildId}/channels/${channelId}`) ou voice
- `UserPanel` en bas (sticky/mt-auto)
- Si pas de `guildId` → null (rien affiché)

---

### `apps/harmonie/src/features/user/UserPanel.tsx` — nouveau

- Lit depuis `useUser()`
- Avatar : `<img>` si `avatarUrl`, sinon carré/cercle avec initiale (`displayName ?? username`)
- Affiche `displayName ?? username`
- Icônes : `Mic`, `Headphones`, `Settings` (lucide-react)

---

### `apps/harmonie/src/routes/index.tsx` — modifié

- `AppLayout` → `MainLayout`
- Ajouter routes imbriquées : `/guilds/:guildId`, `/guilds/:guildId/channels/:channelId`

---

### `apps/harmonie/src/main.tsx` — modifié

```tsx
<AuthProvider>
  <UserProvider>      {/* ← nouveau */}
    <RouterProvider router={router} />
  </UserProvider>
</AuthProvider>
```
 
---

### `docs/roadmap.md` — nouveau

Phases :
- **Phase 1 — Auth** ✅ login, register, JWT, guards
- **Phase 2 — Layout + profil** (cette phase) : `apiFetch`, `users/me`, 3 colonnes, guilds/channels réels
- **Phase 3 — Gestion guilds/channels** : créer guild, créer channel, inviter
- **Phase 4 — Profil utilisateur** : éditer displayName, bio, avatar

---

## Fichiers critiques

| Fichier | Action |
|---------|--------|
| `apps/harmonie/src/api/client.ts` | Créer |
| `apps/harmonie/src/api/users.ts` | Créer |
| `apps/harmonie/src/api/guilds.ts` | Créer |
| `apps/harmonie/src/features/user/UserContext.tsx` | Créer |
| `apps/harmonie/src/features/user/UserPanel.tsx` | Créer |
| `apps/harmonie/src/features/guild/GuildSidebar.tsx` | Créer |
| `apps/harmonie/src/features/channel/ChannelSidebar.tsx` | Créer |
| `apps/harmonie/src/layouts/MainLayout.tsx` | Créer (remplace AppLayout) |
| `apps/harmonie/src/layouts/AppLayout.tsx` | Supprimer |
| `apps/harmonie/src/features/auth/AuthContext.tsx` | Modifier (setLogoutHandler) |
| `apps/harmonie/src/routes/index.tsx` | Modifier (routes + MainLayout) |
| `apps/harmonie/src/main.tsx` | Modifier (UserProvider) |
| `docs/roadmap.md` | Créer |

Réutilisé :
- `getAccessToken()`, `clearTokens()` — `api/authStorage.ts`
- `refreshTokens()` — `api/auth.ts`
- `ApiError` — `api/errors.ts`
- `useAuth()` — `features/auth/AuthContext.tsx`
- Icônes `lucide-react`
- Composants `@harmonie/ui`

---

## Vérification

1. `pnpm run build` dans `apps/harmonie` — pas d'erreurs TypeScript
2. `pnpm lint && pnpm format:check` depuis la racine
3. Dev server → login → layout 3 colonnes visible
4. Sidebar gauche : guilds réels depuis l'API
5. Click guild → channels réels dans la sidebar centrale
6. UserPanel : username + avatar depuis `/api/users/me`
7. Simuler un token expiré → vérifier que le refresh fonctionne et le call est rejoué
