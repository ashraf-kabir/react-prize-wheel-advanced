import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['cjs', 'esm'],
  external: ['react', 'react/jsx-runtime'],
  jsx: 'react-jsx',
});
