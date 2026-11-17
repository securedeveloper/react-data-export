# react-data-export

Export data from React to `.xlsx` and `.csv`.

## Status: 1.0 is a from-scratch rewrite, in progress

- **1.0 has a new API.** It is rebuilt on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0, and its main entry has no `<ExcelFile>` / `<ExcelSheet>` / `<ExcelColumn>`. The 0.6 API ships only as the deprecated `react-data-export/legacy` entry: supported for all of 1.x, removed in 2.0. See [Migrating from 0.x](#migrating-from-0x).
- **1.0 prereleases are on npm's `next` tag:** `npm install react-data-export@next`. They have dataset export (`exportDataset`, `exportWorkbook`, `useExcelExport`, `<ExcelExport>`) and table export for an HTML `<table>` (`exportTable`, `useTableExport`, `<ExportTableButton>`), as specified in [docs/api.md](docs/api.md), built on javascript-excel 2.0's `fromDataset`, `fromTable`, writer and download. The 1.0 feature set is complete: until 1.0.0, changes are limited to fixes found in testing. Coming from 0.x: the [migration guide](docs/migration.md).
- **Big exports stay responsive.** Exports run on the main thread. Since javascript-excel 2.0.0-alpha.7 (react-data-export requires 2.0.0-beta.0 or later), the `.xlsx` writer returns to the event loop about every 16 ms, so the page keeps rendering and handling input during a large export, and `abort()` works while it runs. A `worker` option, which writes the file in a Web Worker on top of `javascript-excel/worker`, comes in a 1.x release after 1.0.0, not in 1.0 ([docs/api.md §7](docs/api.md#7-errors-abort-and-progress)).

  ```tsx
  import { ExcelExport } from 'react-data-export';

  const people = {
    columns: [{ title: 'Name', key: 'name' }, { title: 'Joined', key: 'joined', type: 'date' }],
    data: [{ name: 'Ada', joined: new Date(2024, 0, 15) }],
  };

  <ExcelExport dataset={{ ...people, name: 'People', freezeHeader: true }} filename="people">
    Download people.xlsx
  </ExcelExport>
  ```
- **Try it in the browser:** the [playground](https://react-data-export-playground.vercel.app/) runs the published 1.0 prerelease.
- **0.6.x stays on npm unchanged, and `latest` is still 0.6.0:** a plain `npm install react-data-export` keeps installing 0.6.0 until 1.0.0 is final, and `npm install react-data-export@0.6` keeps working. Nothing is unpublished or deprecated.
- **Legacy code and docs** (0.x README, examples, Babel/Jest setup) live at the [`v0.6.0` tag](https://github.com/securedeveloper/react-data-export/tree/v0.6.0).

## Migrating from 0.x

**Quick path: `react-data-export/legacy`.** To run 0.x code on 1.0 without rewriting it yet, change the import to `import ReactExport from 'react-data-export/legacy'`. That entry has `<ExcelFile>`, `<ExcelSheet>`, `<ExcelColumn>`, the `dataSet` shape and xlsx-style styles. It writes the same files as 0.6.0, without 0.6's bugs: one download under StrictMode, and real CSV. It's **deprecated**: supported for all of 1.x, removed in 2.0, with one development warning. See the guide's [quick path](docs/migration.md#11-quick-path-react-data-exportlegacy).

The [migration guide](docs/migration.md) shows every 0.x pattern next to its 1.0 code: `ExcelFile` + `ExcelSheet` + `ExcelColumn`, `dataSet` with `xSteps`/`ySteps`, `hideElement`, `element`, `fileExtension`, and the xlsx-style cell styles (with a converter). It also lists every intentional behaviour difference. The most common change:

```jsx
// 0.x
<ExcelFile filename="employees" element={<button>Download</button>}>
    <ExcelSheet data={employees} name="Employees">
        <ExcelColumn label="Name" value="name"/>
        <ExcelColumn label="Marital Status" value={(col) => col.is_married ? "Married" : "Single"}/>
    </ExcelSheet>
</ExcelFile>
```

<!-- example: examples/migration/readme.tsx -->
```tsx
// 1.0
import { ExcelExport } from 'react-data-export';

const employees = [{ name: 'Monika', is_married: false }];

export const Download = () => (
  <ExcelExport
    filename="employees"
    dataset={{
      name: 'Employees',
      columns: [
        { title: 'Name', key: 'name' },
        { title: 'Marital Status', value: (row: (typeof employees)[number]) => (row.is_married ? 'Married' : 'Single') },
      ],
      data: employees,
    }}
  >
    Download
  </ExcelExport>
);
```

Things to know before you switch:
- `<ExcelColumn>` headers are now bold, and 0.x's 80 px default column width is gone.
- Dates are written in local time; 0.x converted them as UTC.
- `fileExtension` is replaced by `format: 'xlsx' | 'csv'`. 0.6 saved an xlsx package even for `csv`, `txt`, `xls` and `html`.
- Styles use javascript-excel's keys (`font.size`, `fill: 'FF0000'`, …), and invalid values throw `INVALID_STYLE`.

0.6.x stays on npm unchanged (`npm install react-data-export@0.6`) if you're not ready to move.

## TypeScript support

Types ship with the package (`.d.ts` for `import`, `.d.cts` for `require`). CI type-checks a consumer project against the packed tarball, in strict mode with `skipLibCheck: false`.

**Supported: TypeScript 5.0 and later**, with `moduleResolution` `node16`, `nodenext` (ESM and CommonJS consumers) or `bundler`. Every minor from 5.0 to 5.9, plus 6.0 and 7.0, is tested with `@types/react` 18 and 19. If the 1.0 API ever needs a newer TypeScript, this floor and the CI matrix will change together.

## Repository layout

```
packages/react-data-export/   the published library (TypeScript, ESM + CJS + .d.ts)
apps/playground/              Vite + React 19 dev sandbox, tested in CI (the public playground is
                              securedeveloper/react-data-export-playground)
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
