import { defineConfig, type UserConfig } from 'tsdown';

// `isolatedDeclarations` (tsconfig) makes tsdown emit .d.ts with Oxc, so the
// declaration build does not depend on the TypeScript compiler API (TS 7 has
// none). It also means every export needs an explicit type, including this one.
const config: UserConfig = defineConfig({
  entry: ['src/index.ts', 'src/legacy.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  sourcemap: false,
  clean: true,
  // src/index.ts starts with "use client" (docs/api.md §8). With one entry and
  // no shared chunks rolldown keeps it as the first statement of both builds,
  // but still warns MODULE_LEVEL_DIRECTIVE. Drop only that warning for that
  // directive; scripts/smoke.mjs fails if a built file stops starting with it.
  // The legacy entry has named exports plus the 0.x default export, so CJS
  // consumers get { default, ExcelFile, ... } (what bundlers and TypeScript's
  // esModuleInterop expect). Say so explicitly instead of a MIXED_EXPORTS warning.
  outputOptions: { exports: 'named' },
  inputOptions(options) {
    const next = options.onLog;
    return {
      ...options,
      onLog(level, log, handler) {
        if (log.code === 'MODULE_LEVEL_DIRECTIVE' && log.message.includes('"use client"')) return;
        if (next) next(level, log, handler);
        else handler(level, log);
      },
    };
  },
});

export default config;
