# react-data-export

Export data from React to `.xlsx` and `.csv`.

## Status: 1.0 is a from-scratch rewrite, in progress

- **1.0 is a clean break.** It is being rebuilt on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0 and will not ship the 0.x `<ExcelFile>` / `<ExcelSheet>` / `<ExcelColumn>` API. A migration guide will come with the first beta.
- **Design:** the dataset-export API is specified in [docs/api.md](docs/api.md), for review; it is not implemented yet.
- **Nothing on `main` is usable yet.** The package currently contains only a placeholder (`version` and a `useVersion()` hook) to prove the toolchain. Don't install `1.0.0-alpha.*` expecting features.
- **0.6.x stays on npm unchanged.** `npm install react-data-export@0.6` keeps working; nothing is unpublished or deprecated.
- **Legacy code and docs** (0.x README, examples, Babel/Jest setup) live at the [`v0.6.0` tag](https://github.com/securedeveloper/react-data-export/tree/v0.6.0).

## TypeScript support

Types ship with the package (`.d.ts` for `import`, `.d.cts` for `require`). CI type-checks a consumer project against the packed tarball, in strict mode with `skipLibCheck: false`.

**Supported: TypeScript 5.0 and later**, with `moduleResolution` `node16`, `nodenext` (ESM and CommonJS consumers) or `bundler`. Every minor from 5.0 to 5.9, plus 6.0 and 7.0, is tested with `@types/react` 18 and 19. If the 1.0 API ever needs a newer TypeScript, this floor and the CI matrix will change together.

## Repository layout

```
packages/react-data-export/   the published library (TypeScript, ESM + CJS + .d.ts)
apps/playground/              Vite + React 19 demo app (will be deployed to Vercel)
scripts/                      tarball smoke test and CI helpers
```

## Development

Development needs Node `^22.22.2 || ^24.15.0 || >=26` (the strictest dev-tool floor, from jsdom; tsdown needs 22.18+). The published package declares Node >= 22 and has no Node-specific code.

```sh
npm ci
npm run typecheck
npm test
npm run build      # library (tsdown) + playground (Vite)
npm run smoke      # packs the library and checks ESM import, CJS require and types
npm run consumer-ts -- --ts 5.0,7.0 --react 19   # consumer type-check matrix (see TypeScript support)
```

CI runs the tests on Node 22 and 24 against React 17, 18 and 19. To try another React major locally: `node scripts/use-react.mjs 17` (it rewrites dev ranges and node_modules; restore with `git checkout -- package-lock.json '*/*/package.json' && npm ci`).

## Releasing

Versions are managed with [Changesets](https://github.com/changesets/changesets). Merging a pull request that bumps the version publishes it to npm. See [RELEASING.md](RELEASING.md).

## License

[MIT](LICENSE)
