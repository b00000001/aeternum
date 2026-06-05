import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // Allow .js extensions in TypeScript imports (e.g. from './types.js')
    extensions: ['.ts', '.js'],
  },
});
