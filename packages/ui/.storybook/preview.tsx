import React from 'react';
import type { Preview, Decorator } from '@storybook/react-vite';
import { LIGHT_THEMES, DARK_THEMES } from '../src/themes';
import '../src/styles/index.css';

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? 'default';
  return (
    <div
      data-theme={theme}
      style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '1rem' }}
    >
      <Story />
    </div>
  );
};

const THEME_ITEMS = [
  ...LIGHT_THEMES.map((t) => ({ value: t, title: t, right: '☀️' })),
  ...DARK_THEMES.map((t) => ({ value: t, title: t, right: '🌙' })),
];

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Color theme',
      defaultValue: 'default',
      toolbar: {
        icon: 'paintbrush',
        items: THEME_ITEMS,
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  parameters: {
    options: {
      storySort: {
        order: ['Actions', 'Forms', 'Navigation', 'Identity', 'Display', 'Overlays'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disabled: true },
  },
};

export default preview;
