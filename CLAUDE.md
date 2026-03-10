# Harmonie Client — Instructions pour Claude

## Règles packages/ui

### Composants UI

Tout nouveau composant ajouté dans `packages/ui/src/components/` doit être accompagné d'une story Storybook dans le même dossier.

Structure attendue pour chaque composant :

```
packages/ui/src/components/
└── MonComposant/
    ├── MonComposant.tsx          ← composant
    └── MonComposant.stories.tsx  ← story Storybook (obligatoire)
```

Les stories doivent :

- Couvrir les principaux états et variantes du composant
- Inclure une story interactive (avec state) si le composant est interactif
- Utiliser `tags: ['autodocs']` dans le meta

## Règles générales

### Internationalisation (i18n)

Tout texte visible par l'utilisateur doit passer par `useTranslation()` de `react-i18next`. Ne jamais écrire de chaînes en dur dans les composants.

- Utiliser `const { t } = useTranslation()` et `{t('clé')}` dans le JSX
- Ajouter la clé dans **les deux fichiers** `apps/harmonie/src/i18n/locales/fr.ts` **et** `en.ts`
- Organiser les clés par domaine fonctionnel (ex : `auth.*`, `guild.*`)
- Les données dynamiques venant de l'API (noms d'utilisateur, noms de guild…) ne sont pas concernées

### Icônes

Toujours utiliser `lucide-react` pour les icônes. Ne pas créer de SVG inline custom si l'icône existe dans Lucide.

### Composants

Toujours utiliser les composants de `@harmonie/ui` quand ils existent (ex: `Button`, `Input`, `Separator`…). Ne pas recréer des éléments HTML natifs stylés à la main si le composant UI correspondant est disponible.

### Commentaires dans le code

Tous les commentaires dans le code source doivent être écrits en **anglais**.
