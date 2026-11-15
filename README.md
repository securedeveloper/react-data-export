# react-data-export

Export data from React to `.xlsx` and `.csv`.

## Status: 1.0 is a from-scratch rewrite, in progress

- **1.0 is a clean break.** It is being rebuilt on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0 and will not ship the 0.x `<ExcelFile>` / `<ExcelSheet>` / `<ExcelColumn>` API. A migration guide will come with the first beta.
- **Nothing on `master` is usable yet.** The package currently contains only a placeholder (`version` and a `useVersion()` hook) to prove the toolchain. Don't install `1.0.0-alpha.*` expecting features.
- **0.6.x stays on npm unchanged.** `npm install react-data-export@0.6` keeps working; nothing is unpublished or deprecated.
- **Legacy code and docs** (0.x README, examples, Babel/Jest setup) live at the [`v0.6.0` tag](https://github.com/securedeveloper/react-data-export/tree/v0.6.0).

## Repository layout

```
packages/react-data-export/   the published library (TypeScript, ESM + CJS + .d.ts)
apps/playground/              Vite + React 19 demo app (will be deployed to Vercel)
scripts/                      tarball smoke test and CI helpers
```

## Development

Requires Node 22 or 24 for the toolchain (the published package targets Node >= 20).

```sh
npm ci
npm run typecheck
npm test
npm run build      # library (tsdown) + playground (Vite)
npm run smoke      # packs the library and checks ESM import, CJS require and types
```

CI runs the tests on Node 22 and 24 against React 17, 18 and 19. To try another React major locally: `node scripts/use-react.mjs 17` (it rewrites dev ranges and node_modules; restore with `git checkout -- package-lock.json '*/*/package.json' && npm ci`).

## License

[MIT](LICENSE)
