import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

const ReactCompilerConfig = {
  target: '19',
};

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      exclude: /packages\/ui\/dist\//,
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/types/**',
        'src/i18n/locales/**',
        'src/features/guild/settings/adminSection.ts',
        'src/shared/message/messageAuthor.ts',
        'src/shared/message/attachments/MessageAttachmentLightboxState.ts',
        'src/features/channel/text/hooks/useChannelMessages.ts',
        'src/features/guild/form/GuildLogoPicker.tsx',
        'src/shared/voice/components/VoiceParticipantTile.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
