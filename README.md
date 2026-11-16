# react-data-export

Export data from React to `.xlsx` and `.csv`.

## Status: 1.0 is a from-scratch rewrite, in progress

- **1.0 is a clean break.** It is being rebuilt on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0 and will not ship the 0.x `<ExcelFile>` / `<ExcelSheet>` / `<ExcelColumn>` API. See [Migrating from 0.x](#migrating-from-0x).
- **1.0 prereleases are on npm's `next` tag:** `npm install react-data-export@next`. They have dataset export (`exportDataset`, `exportWorkbook`, `useExcelExport`, `<ExcelExport>`) and table export for an HTML `<table>` (`exportTable`, `useTableExport`, `<ExportTableButton>`), as specified in [docs/api.md](docs/api.md), built on javascript-excel 2.0's `fromDataset`, `fromTable`, writer and download. As an alpha, the API may still change before 1.0.0. Coming from 0.x: the [migration guide](docs/migration.md).

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
- **0.6.x stays on npm unchanged, and `latest` is still 0.6.0:** a plain `npm install react-data-export` keeps installing 0.6.0 until 1.0.0 is final, and `npm install react-data-export@0.6` keeps working. Nothing is unpublished or deprecated.
- **Legacy code and docs** (0.x README, examples, Babel/Jest setup) live at the [`v0.6.0` tag](https://github.com/securedeveloper/react-data-export/tree/v0.6.0).

## Migrating from 0.x

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
