# Contributing to react-data-export

react-data-export 1.0 is being rewritten from scratch (see the [README](README.md)). Until the first beta, the API is not settled, so please open an issue to discuss before sending a feature PR.

## Setup

```sh
git clone https://github.com/securedeveloper/react-data-export
cd react-data-export
npm ci
```

Use Node 22.22.2+ or 24.15+ (`.nvmrc` pins 26). Older 22.x/24.x releases are below the jsdom and tsdown engine floors.

## Before opening a PR

```sh
npm run typecheck
npm test
npm run build
npm run smoke
```

- Library code lives in `packages/react-data-export/src`, tests in `packages/react-data-export/test` (Vitest + React Testing Library).
- Everything is TypeScript with `strict` on.
- New dependencies need a reason in the PR description. The library itself should stay free of runtime dependencies other than the spreadsheet engine.

Bug reports and PRs against 0.6.x are welcome as issues; the 0.x code is at the [`v0.6.0` tag](https://github.com/securedeveloper/react-data-export/tree/v0.6.0).
