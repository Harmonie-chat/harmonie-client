import { defineConfig } from 'vite';
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
});
