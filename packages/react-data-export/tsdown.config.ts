import { defineConfig, type UserConfig } from 'tsdown';

// `isolatedDeclarations` (tsconfig) makes tsdown emit .d.ts with Oxc, so the
// declaration build does not depend on the TypeScript compiler API (TS 7 has
// none). It also means every export needs an explicit type, including this one.
const config: UserConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  sourcemap: true,
  clean: true,
});

export default config;
