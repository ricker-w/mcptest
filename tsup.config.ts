import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'node20',
  splitting: false,
  sourcemap: true,
  shims: true,
});
