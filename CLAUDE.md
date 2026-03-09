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

### Icônes

Toujours utiliser `lucide-react` pour les icônes. Ne pas créer de SVG inline custom si l'icône existe dans Lucide.

### Composants

Toujours utiliser les composants de `@harmonie/ui` quand ils existent (ex: `Button`, `Input`, `Separator`…). Ne pas recréer des éléments HTML natifs stylés à la main si le composant UI correspondant est disponible.
