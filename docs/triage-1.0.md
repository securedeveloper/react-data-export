# react-data-export 1.0: issue and pull request triage plan

Status: **decided (2026-11-16). Afzal accepted every recommendation.** Revised after `react-data-export/legacy` (1.0.0-alpha.2): the footer gained one sentence, and the comments for #138, #141, #155, #160 and the thank-yous for #143, #171, #176 mention `/legacy`. **The revision awaits Afzal's re-approval.** The decisions:
1. the comment texts below are approved as written;
2. the "fixed" issues are closed when `1.0.0-alpha.1` is published, not at 1.0.0;
3. the credit lines go into the 1.0.0-alpha.1 changelog (as a patch changeset in the release PR, #195);
4. #76 and #94 stay open until Afzal's check in Excel.

Nothing has been posted or closed yet: the comments go out once `1.0.0-alpha.1` is on npm, when the links (the prerelease, the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md)) resolve. No labels are added.

Snapshot: 68 open issues and 8 open community pull requests, fetched 2026-11-16. Dispositions are checked against 1.0.0-alpha.1 (dataset and table export, [docs/api.md](api.md)) on javascript-excel 2.0.0-alpha.2.

| disposition | issues | action |
|---|---|---|
| Fixed in 1.0.0-alpha.1 | 57 | close with comment |
| Out of scope | 7 | close with comment |
| Still open, tracked | 2 | keep open, comment |
| Still open, verify in Excel | 2 | keep open, comment; close after the Excel check |
| **total** | **68** | |

Every comment ends with the same footer:

> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

## 1. Community pull requests

1.0 is a from-scratch rewrite, so none of these can be merged as they are: they change 0.x files (`src/ExcelPlugin`, `types/index.d.ts`, `dist/`) that no longer exist. Each one is closed with thanks, a pointer to where its idea landed, and a credit line in the 1.0.0-alpha.1 CHANGELOG.

| PR | author | idea | where it landed in 1.0 |
|---|---|---|---|
| #143 | @samuelhulla | Correct the `ExcelCell` typing (#141) | Cells are javascript-excel's `CellInput` (a value, or `{ value, style, formula, hyperlink }`), re-exported; the types are generated from the source and checked on TypeScript 5.0–7.0. And `react-data-export/legacy` has the `ExcelCell` type with exactly this fix, `value: ExcelValue`. |
| #161 | @atefBB | Document the real `alignment.horizontal` values | Alignment is javascript-excel's documented `Alignment` type (`horizontal: 'left' \| 'center' \| 'right' \| …`), so editors autocomplete the valid values. |
| #165 | @mehmetyilmaz001 | Nested object access in columns (`user.name`, #164) | Column `path`: `{ path: 'user.name' }` (and `'items[0].name'`), in javascript-excel's `fromDataset`. |
| #167 | @apperside | A callback after the file is generated | Every export returns a promise, `<ExcelExport onExported>` and `onError`, and the hook's `status`/`result`. |
| #171 | @xaviergeorge | Fix the `ExcelCell` value type (#141) | Same as #143: `CellInput` from javascript-excel, and `react-data-export/legacy`'s `ExcelCell` with `value: ExcelValue`. |
| #174 | @tobwithu | Make the types work with React + TypeScript | Types ship in the package (`.d.ts` and `.d.cts` through the `exports` map) and a consumer project is type-checked in CI on every TypeScript minor 5.0–7.0. |
| #176 | @saeedkhal | Skip falsy (conditional) columns | Falsy entries in `columns` are skipped, and falsy entries in `sheets` too; `react-data-export/legacy` skips falsy `<ExcelColumn>` and `<ExcelSheet>` children the same way. |
| #180 | @imsuvesh | Ship the type declarations where npm resolves them (#179, #146, #64) | Same as #174: declarations in `dist/`, resolved through `exports`, verified by publint and are-the-types-wrong. |

### Draft thank-you comments

**#143** (close):

> Thank you @samuelhulla, and sorry this waited so long. react-data-export 1.0 is a from-scratch rewrite on javascript-excel 2.0, so this PR can't be merged into the new code, but its idea is in 1.0: Cells are javascript-excel's `CellInput` (a value, or `{ value, style, formula, hyperlink }`), re-exported; the types are generated from the source and checked on TypeScript 5.0–7.0. And `react-data-export/legacy` has the `ExcelCell` type with exactly this fix, `value: ExcelValue`. You're credited in the 1.0.0-alpha.1 changelog. Try it with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) covers the move from 0.x. Closing in favour of 1.0; thanks again for contributing.

**#161** (close):

> Thank you @atefBB, and sorry this waited so long. react-data-export 1.0 is a from-scratch rewrite on javascript-excel 2.0, so this PR can't be merged into the new code, but its idea is in 1.0: Alignment is javascript-excel's documented `Alignment` type (`horizontal: 'left' | 'center' | 'right' | …`), so editors autocomplete the valid values. You're credited in the 1.0.0-alpha.1 changelog. Try it with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) covers the move from 0.x. Closing in favour of 1.0; thanks again for contributing.

**#165** (close):

> Thank you @mehmetyilmaz001, and sorry this waited so long. react-data-export 1.0 is a from-scratch rewrite on javascript-excel 2.0, so this PR can't be merged into the new code, but its idea is in 1.0: Column `path`: `{ path: 'user.name' }` (and `'items[0].name'`), in javascript-excel's `fromDataset`. You're credited in the 1.0.0-alpha.1 changelog. Try it with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) covers the move from 0.x. Closing in favour of 1.0; thanks again for contributing.

**#167** (close):

> Thank you @apperside, and sorry this waited so long. react-data-export 1.0 is a from-scratch rewrite on javascript-excel 2.0, so this PR can't be merged into the new code, but its idea is in 1.0: Every export returns a promise, `<ExcelExport onExported>` and `onError`, and the hook's `status`/`result`. You're credited in the 1.0.0-alpha.1 changelog. Try it with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) covers the move from 0.x. Closing in favour of 1.0; thanks again for contributing.

**#171** (close):

> Thank you @xaviergeorge, and sorry this waited so long. react-data-export 1.0 is a from-scratch rewrite on javascript-excel 2.0, so this PR can't be merged into the new code, but its idea is in 1.0: Same as #143: `CellInput` from javascript-excel, and `react-data-export/legacy`'s `ExcelCell` with `value: ExcelValue`. You're credited in the 1.0.0-alpha.1 changelog. Try it with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) covers the move from 0.x. Closing in favour of 1.0; thanks again for contributing.

**#174** (close):

> Thank you @tobwithu, and sorry this waited so long. react-data-export 1.0 is a from-scratch rewrite on javascript-excel 2.0, so this PR can't be merged into the new code, but its idea is in 1.0: Types ship in the package (`.d.ts` and `.d.cts` through the `exports` map) and a consumer project is type-checked in CI on every TypeScript minor 5.0–7.0. You're credited in the 1.0.0-alpha.1 changelog. Try it with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) covers the move from 0.x. Closing in favour of 1.0; thanks again for contributing.

**#176** (close):

> Thank you @saeedkhal, and sorry this waited so long. react-data-export 1.0 is a from-scratch rewrite on javascript-excel 2.0, so this PR can't be merged into the new code, but its idea is in 1.0: Falsy entries in `columns` are skipped, and falsy entries in `sheets` too; `react-data-export/legacy` skips falsy `<ExcelColumn>` and `<ExcelSheet>` children the same way. You're credited in the 1.0.0-alpha.1 changelog. Try it with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) covers the move from 0.x. Closing in favour of 1.0; thanks again for contributing.

**#180** (close):

> Thank you @imsuvesh, and sorry this waited so long. react-data-export 1.0 is a from-scratch rewrite on javascript-excel 2.0, so this PR can't be merged into the new code, but its idea is in 1.0: Same as #174: declarations in `dist/`, resolved through `exports`, verified by publint and are-the-types-wrong. You're credited in the 1.0.0-alpha.1 changelog. Try it with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) covers the move from 0.x. Closing in favour of 1.0; thanks again for contributing.

### CHANGELOG credit lines

In the 1.0.0-alpha.1 changelog: added as one patch changeset (`.changeset/community-credits.md`) in the release PR #195, which Changesets lists under the release:

```md
Thanks to the community pull requests whose ideas shaped 1.0:
- #143 by @samuelhulla: correct the `ExcelCell` typing (#141).
- #161 by @atefBB: document the real `alignment.horizontal` values.
- #165 by @mehmetyilmaz001: nested object access in columns (`user.name`, #164).
- #167 by @apperside: a callback after the file is generated.
- #171 by @xaviergeorge: fix the `ExcelCell` value type (#141).
- #174 by @tobwithu: make the types work with React + TypeScript.
- #176 by @saeedkhal: skip falsy (conditional) columns.
- #180 by @imsuvesh: ship the type declarations where npm resolves them (#179, #146, #64).
```

## 2. Issues

### Install, bundling and dependencies

| # | title | disposition | how / reason |
|---|---|---|---|
| #85 | Error by importing the project | Fixed in 1.0.0-alpha.1 | No `tempa-xlsx`, `xlsx`, `file-saver` or `prop-types` any more; the only dependency is javascript-excel (no runtime deps). Import errors from the old dependency chain can't happen. |
| #90 | issue in react js dependence added time Module not found: Can't resolve 'react-data-export'  using | Fixed in 1.0.0-alpha.1 | Same: the 0.x dependency chain is gone; `exports` map with ESM + CJS + types, smoke-tested from the packed tarball in CI. |
| #100 | Module not found: Can't resolve 'prop-types' in \node_modules\react-data-export\dist\ExcelPlugin\components | Fixed in 1.0.0-alpha.1 | `prop-types` is not used in 1.0. |
| #110 | xlsx dependency blows up webpack bundle size | Fixed in 1.0.0-alpha.1 | `xlsx`/`tempa-xlsx` are no longer dependencies; javascript-excel has zero runtime dependencies and per-entry tree-shaking (writer, CSV, DOM are separate entries). Bundle size: [placeholder, measure in the bundler matrix]. |
| #168 | Module not found can't resolve 'fs' in node_modules\tempa-xlsx | Fixed in 1.0.0-alpha.1 | No `tempa-xlsx`, so no `fs` import; covered by the CRA/webpack 5 fixture in the bundler matrix (RDE-1.11). |
| #169 | Why does xlsx get installed into my package.json when installing this package | Fixed in 1.0.0-alpha.1 | `xlsx` is not a dependency or a required peer in 1.0. |
| #173 | Application crash when using vitejs | Fixed in 1.0.0-alpha.1 | No `cptable`/`xlsx` code; Vite fixture in the bundler matrix. |
| #177 | Could not resolve "xlsx" vite js | Fixed in 1.0.0-alpha.1 | No `tempa-xlsx` dynamic `require('xl' + 'sx')`; Vite fixture. |
| #182 | jszip is not a constructor | Fixed in 1.0.0-alpha.1 | No `jszip`: javascript-excel has its own zip writer on the native `CompressionStream`. |
| #183 | react-data-export is not rendering in my react app | Fixed in 1.0.0-alpha.1 | React 18 (and 17/19) tested in CI; no `xlsx` import needed. |
| #159 | Unable to install | Out of scope | The report is about `react-export-excel`, a separate fork, not this package. |

### TypeScript

| # | title | disposition | how / reason |
|---|---|---|---|
| #64 | Typescript definitions for components | Fixed in 1.0.0-alpha.1 | Types ship with the package (`.d.ts` + `.d.cts`), checked by Consumer TS on TypeScript 5.0–7.0. |
| #146 | Typescript declarations do not work? | Fixed in 1.0.0-alpha.1 | Same as #64. |
| #179 | How I can use this library for reat typescript? | Fixed in 1.0.0-alpha.1 | Types ship with react-data-export 1.0 (the report mentions the `react-export-excel` fork, which isn't this package). |
| #141 | Incorrect type definition - ExcelCell | Fixed in 1.0.0-alpha.1 | 0.x `ExcelCell` typing replaced by javascript-excel's `CellInput`/`Cell` (re-exported). |

### File formats and file validity

| # | title | disposition | how / reason |
|---|---|---|---|
| #25 | Export to CSV and XLS | Fixed in 1.0.0-alpha.1 | CSV: `format: 'csv'` (real CSV writer, BOM by default). XLS and PDF are out of scope (see #163 for XLS). |
| #138 | Export to CSV format not working | Fixed in 1.0.0-alpha.1 | CSV is written by javascript-excel's RFC 4180 writer, with a UTF-8 BOM for Excel and a formula-injection guard. |
| #163 | How to export data to xsl? | Out of scope | Legacy `.xls` (BIFF8) isn't written by javascript-excel 2.0. |
| #153 | Generated file is 10 times bigger in size  than file created from MS excel | Fixed in 1.0.0-alpha.1 | javascript-excel compresses every part with deflate (default) and uses a shared-strings table; 0.x output was much larger. |
| #76 | Can't open files downloaded on Mac | Still open, verify in Excel | New writer; output validated by LibreOffice and openpyxl in javascript-excel's CI. Needs a check in Excel for Mac before closing. |
| #94 | Excel Says 'Recover File' When Try to Create More Than One Sheets | Still open, verify in Excel | Multi-sheet workbooks are written by the new writer and validated by LibreOffice/openpyxl. Needs a check in Excel ('Recover file') before closing. |

### Data access, columns, sheets and programmatic export

| # | title | disposition | how / reason |
|---|---|---|---|
| #147 | cant access nested json data ? | Fixed in 1.0.0-alpha.1 | Nested paths: `{ path: 'address[0].city' }`. |
| #164 | Accessing Nested Objects | Fixed in 1.0.0-alpha.1 | Nested paths: `{ path: 'user.name' }` (idea from PR #165). |
| #151 | Export nested array is not working | Fixed in 1.0.0-alpha.1 | Computed column: `{ value: (r) => r.phone_nums.join(', ') }`. |
| #155 | conditionally hide a ExcelColumn from display | Fixed in 1.0.0-alpha.1 | Falsy `columns` entries are skipped (idea from PR #176). |
| #160 | Unable to Add Condition on <ExcelSheet> for condition base export of sheet tab | Fixed in 1.0.0-alpha.1 | Falsy `sheets` entries are skipped in `exportWorkbook` / `<ExcelExport workbook>`. |
| #89 | Function to call export excel doesn't' works! | Fixed in 1.0.0-alpha.1 | Programmatic export: `exportDataset()` (plain async function) or `useExcelExport()`. |
| #178 | Multiple excel download using single button click | Fixed in 1.0.0-alpha.1 | Several files from one click: `Promise.all([exportDataset(a), exportDataset(b)])`. Zipping them is out of scope. |
| #75 | React.Fragment like support? | Fixed in 1.0.0-alpha.1 | Several datasets on one sheet: a sheet with `blocks` (`fromDatasets`). |
| #134 | Unable to print multiple datasets with same ySteps | Still open, tracked | Side-by-side blocks: works today only with a negative `offset.rows` (`{ rows: -<previous block height>, cols }`, measured on alpha.1); a clear side-by-side option would be a javascript-excel `fromDatasets` feature. |
| #87 | Title/header for tables in case of multiple data sets | Fixed in 1.0.0-alpha.1 | A title above each dataset: a header group spanning the block's columns, per block. |

### Headers, header groups and merges

| # | title | disposition | how / reason |
|---|---|---|---|
| #88 | FEATURE: Make header cell stylable. | Fixed in 1.0.0-alpha.1 | `headerStyle` per sheet and per column. |
| #98 | Support for header groups | Fixed in 1.0.0-alpha.1 | Header groups: `{ title, children }` (merged header cells). |
| #150 | How can Sub Header be incorporated | Fixed in 1.0.0-alpha.1 | Sub headers = header groups. |
| #101 | Is it possible to remove header row?? | Fixed in 1.0.0-alpha.1 | `header: false`. |
| #91 | not able to use Colspan | Fixed in 1.0.0-alpha.1 | Merged header cells via header groups; merged body cells via `exportTable` on a table with `colspan`/`rowspan`. |
| #95 | Colspam / Header Styles - Feature | Fixed in 1.0.0-alpha.1 | Same as #91 (colspan) plus `headerStyle` (header styles). |
| #96 | How to merge cell | Fixed in 1.0.0-alpha.1 | Same as #91. |
| #127 | How to use colspan? | Fixed in 1.0.0-alpha.1 | Same as #91. |
| #157 | how can i set value of column on right side and title column on left? | Fixed in 1.0.0-alpha.1 | Header groups + `rightToLeft`. |

### Styles

| # | title | disposition | how / reason |
|---|---|---|---|
| #92 | Cell Alignment failed | Fixed in 1.0.0-alpha.1 | `style: { alignment: { horizontal: 'right' } }`. |
| #181 | Documentation on cell alignment is incorrect | Fixed in 1.0.0-alpha.1 | 0.x docs replaced; alignment (horizontal and vertical) is javascript-excel's documented `Alignment` (PR #161 corrected the 0.x values). |
| #113 | Style on <ExcelColumn> while using "data" not "dataSet" on <ExcelSheet> | Fixed in 1.0.0-alpha.1 | Column `style` and `headerStyle` work for object data. |
| #114 | I want to center the excel column, set a border | Fixed in 1.0.0-alpha.1 | `alignment.horizontal: 'center'` and `border` (all sides, all styles). |
| #133 | Is this package missing border styling? | Fixed in 1.0.0-alpha.1 | Borders are written (every style, a colour per side). |
| #149 | TypeError: s.t.match is not a function when trying to use style for Column heading | Fixed in 1.0.0-alpha.1 | The 0.x style crash on headings is gone (new writer). |
| #130 | Cannot read property 'match' of undefined | Fixed in 1.0.0-alpha.1 | The 0.x `match` crash is gone (new engine). |

### Column widths

| # | title | disposition | how / reason |
|---|---|---|---|
| #97 | How to set the column width automatically | Fixed in 1.0.0-alpha.1 | `width: 'auto'` per column or `autoWidth: true` per sheet. |
| #129 | Set Custom width to Excel Columns | Fixed in 1.0.0-alpha.1 | `width: { wch }` / `{ wpx }`. |
| #152 | how can i set auto-width on column? | Fixed in 1.0.0-alpha.1 | `autoWidth`. |

### Number and date formats

| # | title | disposition | how / reason |
|---|---|---|---|
| #111 | Can I use NumFmt without a dataset? | Fixed in 1.0.0-alpha.1 | `numFmt` per column. |
| #139 | Date type column is not working | Fixed in 1.0.0-alpha.1 | `type: 'date'` writes real dates (filterable). |

### Formulas and totals

| # | title | disposition | how / reason |
|---|---|---|---|
| #103 | How use formula in dataSat | Fixed in 1.0.0-alpha.1 | Totals row (`total: 'sum'`) or a cell `{ formula: 'SUM(A2:B2)' }` from a computed column. |
| #175 | how to add 2 cells at the end of my sheet, one with static text and the other with a summed total? | Fixed in 1.0.0-alpha.1 | `total: 'sum'` + `totals: { label: 'Total' }`. |

### Hyperlinks

| # | title | disposition | how / reason |
|---|---|---|---|
| #99 | react-data-excel Hyperlinks | Fixed in 1.0.0-alpha.1 | Cells `{ value, hyperlink }`; table links (`<a href>`) via `exportTable`. |

### Right-to-left

| # | title | disposition | how / reason |
|---|---|---|---|
| #109 | Make sheet/File right to left | Fixed in 1.0.0-alpha.1 | `rightToLeft: true`. |
| #162 | Question: How to set right to left reading order? | Fixed in 1.0.0-alpha.1 | `rightToLeft: true`. |

### Workbook options

| # | title | disposition | how / reason |
|---|---|---|---|
| #81 | Active Sheet - Feature | Fixed in 1.0.0-alpha.1 | `activeSheet` in `exportWorkbook`. |

### HTML tables

| # | title | disposition | how / reason |
|---|---|---|---|
| #172 | Export html table to excel | Fixed in 1.0.0-alpha.1 | `exportTable` / `useTableExport` / `<ExportTableButton>`. |

### Large exports

| # | title | disposition | how / reason |
|---|---|---|---|
| #154 | The maximum you can export to excel is 1299 rows, how to increase the number of exported rows? | Fixed in 1.0.0-alpha.1 | Measured on alpha.1 (Node 24): 1,300 / 10,000 / 100,000 rows × 3 columns export and read back complete (100k rows: 318 ms, 2.1 MB). |
| #170 | Browser window stops responding | Still open, tracked | The javascript-excel writer works in chunks and yields; a worker option (`javascript-excel/worker`) is planned for react-data-export 1.x. Keep open until the worker option ships. |

### Out of scope for 1.0

| # | title | disposition | how / reason |
|---|---|---|---|
| #102 | How to add image in particular column | Out of scope | Images aren't written by javascript-excel 2.0; planned in its 2.x. |
| #145 | Images | Out of scope | Same as #102. |
| #126 | Column with dropdown select. | Out of scope | Data validation (dropdowns) is planned in javascript-excel 2.x. |
| #107 | How to use existing excel file as template | Out of scope | Filling an existing file (template) isn't a react-data-export API; javascript-excel 2.x plans template (`.xltx`) write-back. |
| #112 | React data export not working in web view | Out of scope | Android WebView doesn't run browser downloads of blob URLs; with `download: false` an export returns the `Blob` for the app's own bridge. |

### Release questions

| # | title | disposition | how / reason |
|---|---|---|---|
| #135 | What is the expected new release date? | Fixed in 1.0.0-alpha.1 | Answered by the 1.0 prerelease. |
| #140 | When re-write will come ? | Fixed in 1.0.0-alpha.1 | Answered by the 1.0 prerelease. |

## 3. Draft issue comments

Each comment is followed by the footer above. "Close" means close after posting; "keep open" means post and leave open.

**#25** (close):

> Fixed in react-data-export 1.0.0-alpha.1: CSV is a first-class format: `format: 'csv'` on any export. Legacy `.xls` and PDF aren't supported: `.xls` is on javascript-excel's [roadmap](https://github.com/securedeveloper/javascript-excel/blob/main/docs/api.md#13-roadmap-beyond-20) (4.x), PDF isn't planned. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#64** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 is written in TypeScript and ships its declarations. CI type-checks a consumer project on every TypeScript minor from 5.0 to 7.0. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#75** (close):

> Fixed in react-data-export 1.0.0-alpha.1: several datasets on one sheet are `blocks`: `exportWorkbook({ sheets: [{ name: 'Report', blocks: [first, second] }] })`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#76** (keep open):

> Update for 1.0: 1.0 writes files with a new engine whose output is checked by LibreOffice and openpyxl in CI. Before closing, we'll confirm that a 1.0 file opens in Excel for Mac; if you can try `react-data-export@next`, a report here would help.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#81** (close):

> Fixed in react-data-export 1.0.0-alpha.1: `exportWorkbook({ sheets, activeSheet: 1 })` opens the file on the second sheet. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#85** (close):

> Fixed in react-data-export 1.0.0-alpha.1: the 0.x import errors came from the `tempa-xlsx`/`xlsx` dependency chain. 1.0 depends only on javascript-excel (itself dependency-free) and imports as `import { ExcelExport } from 'react-data-export'`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#87** (close):

> Fixed in react-data-export 1.0.0-alpha.1: a title above each dataset is a header group: `columns: [{ title: 'Q1 sales', children: [...the columns...] }]`, and with `blocks` each dataset gets its own. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#88** (close):

> Fixed in react-data-export 1.0.0-alpha.1: header cells are styled with `headerStyle`, per sheet or per column. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#89** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 exports from code without a component: `await exportDataset({ columns, data }, { filename: 'report' })`, or `useExcelExport()` in a component. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#90** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 ships ESM, CommonJS and type declarations through a standard `exports` map, and CI installs the packed tarball in a clean project on every change. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#91** (close):

> Fixed in react-data-export 1.0.0-alpha.1: header cells merge through header groups, and any `colspan`/`rowspan` in an HTML table becomes a merge with `exportTable` / `<ExportTableButton>`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#92** (close):

> Fixed in react-data-export 1.0.0-alpha.1: right alignment is `style: { alignment: { horizontal: 'right' } }` on a column or cell (`readingOrder` controls text direction, not alignment). If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#94** (keep open):

> Update for 1.0: multi-sheet workbooks are written by 1.0's new engine and validated by LibreOffice and openpyxl in CI. Before closing, we'll confirm Excel opens a 1.0 multi-sheet file without 'Recover'; a report with `react-data-export@next` would help.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#95** (close):

> Fixed in react-data-export 1.0.0-alpha.1: colspan: header groups or `exportTable` on a `colspan` table; header styles: `headerStyle`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#96** (close):

> Fixed in react-data-export 1.0.0-alpha.1: merges come from header groups or from `colspan`/`rowspan` in a table exported with `exportTable`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#97** (close):

> Fixed in react-data-export 1.0.0-alpha.1: automatic widths: `width: 'auto'` on a column, or `autoWidth: true` for the sheet. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#98** (close):

> Fixed in react-data-export 1.0.0-alpha.1: header groups are `{ title: 'Q1', children: [{ title: 'Jan', key: 'jan' }, ...] }`, written as merged header cells. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#99** (close):

> Fixed in react-data-export 1.0.0-alpha.1: hyperlinks are cells: `value: (r) => ({ value: r.name, hyperlink: { target: r.url } })`; `<a href>` in an exported table becomes a link too. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#100** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 doesn't use `prop-types` (props are typed in TypeScript), so this resolution error can't occur. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#101** (close):

> Fixed in react-data-export 1.0.0-alpha.1: pass `header: false` to leave out the header row. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#102** (close):

> Thanks for the report. Closing as out of scope for 1.0: images aren't supported yet. javascript-excel plans images in 2.x ([roadmap](https://github.com/securedeveloper/javascript-excel/blob/main/docs/api.md#13-roadmap-beyond-20)); react-data-export will pick them up from there.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#103** (close):

> Fixed in react-data-export 1.0.0-alpha.1: a totals row is `total: 'sum'` on a column, and any cell can be a formula: `value: () => ({ formula: 'SUM(A2:B2)' })`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#107** (close):

> Thanks for the report. Closing as out of scope for 1.0: filling an existing file isn't something react-data-export 1.0 does. javascript-excel can read a workbook (`javascript-excel/read`), and template write-back (`.xltx`) is planned in its 2.x ([roadmap](https://github.com/securedeveloper/javascript-excel/blob/main/docs/api.md#13-roadmap-beyond-20)).
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#109** (close):

> Fixed in react-data-export 1.0.0-alpha.1: `rightToLeft: true` makes the whole sheet right-to-left. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#110** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 no longer pulls in `xlsx`/`tempa-xlsx`. It builds on javascript-excel, which has no runtime dependencies and splits writer, CSV and DOM code into separate entries so bundlers only keep what you use. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#111** (close):

> Fixed in react-data-export 1.0.0-alpha.1: number formats are per column: `{ title: 'Amount', key: 'amount', numFmt: '#,##0.00' }`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#112** (close):

> Thanks for the report. Closing as out of scope for 1.0: Android WebViews don't handle browser downloads of blob URLs, so no web library can trigger them there. In 1.0, `exportDataset(ds, { download: false })` returns the file as a `Blob` that your app can hand to its native bridge.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#113** (close):

> Fixed in react-data-export 1.0.0-alpha.1: styles apply per column (`style`, `headerStyle`) whatever the data shape. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#114** (close):

> Fixed in react-data-export 1.0.0-alpha.1: centre with `alignment: { horizontal: 'center' }` and add borders with `border: { top: { style: 'thin' }, ... }`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#126** (close):

> Thanks for the report. Closing as out of scope for 1.0: dropdowns are data validation, planned in javascript-excel 2.x ([roadmap](https://github.com/securedeveloper/javascript-excel/blob/main/docs/api.md#13-roadmap-beyond-20)).
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#127** (close):

> Fixed in react-data-export 1.0.0-alpha.1: colspan: header groups (`children`) for datasets, or `exportTable` for an HTML table with `colspan`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#129** (close):

> Fixed in react-data-export 1.0.0-alpha.1: column widths are `width: { wch: 20 }` (characters) or `{ wpx: 120 }` (pixels). If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#130** (close):

> Fixed in react-data-export 1.0.0-alpha.1: this crash came from the 0.x engine, which 1.0 no longer uses. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#133** (close):

> Fixed in react-data-export 1.0.0-alpha.1: borders are written: `border: { top: { style: 'thick', color: 'FFAA00' }, ... }`. Note the 0.x shape `{ style, color }` at the top level isn't a border; each side is its own entry. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#134** (keep open):

> Update for 1.0: in 1.0 a second block can sit next to the first with a negative row offset (`blocks: [a, { ...b, offset: { rows: -3, cols: 2 } }]` for a 3-row first block). That works but isn't obvious, so we're keeping this open for a clearer side-by-side option in javascript-excel's `fromDatasets`.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#135** (close):

> Fixed in react-data-export 1.0.0-alpha.1: the 1.0 prerelease is out. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#138** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 0.x wrote an xlsx-style payload with a `.csv` name. 1.0 writes real CSV (RFC 4180, UTF-8 with BOM so Excel detects it): `exportDataset(ds, { format: 'csv' })`, or `fileExtension="csv"` with `react-data-export/legacy` (since 1.0.0-alpha.2). If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#139** (close):

> Fixed in react-data-export 1.0.0-alpha.1: `type: 'date'` writes real Excel dates, so filters treat them as dates: `{ title: 'Joined', key: 'joined', type: 'date' }`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#140** (close):

> Fixed in react-data-export 1.0.0-alpha.1: the rewrite is out as a prerelease. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#141** (close):

> Fixed in react-data-export 1.0.0-alpha.1: in the 1.0 API, cells are javascript-excel's `CellInput` (a value, or `{ value, style, formula, hyperlink }`), re-exported from react-data-export. For 0.x code, `react-data-export/legacy` (since 1.0.0-alpha.2) has an `ExcelCell` type with the corrected `value: ExcelValue`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#145** (close):

> Thanks for the report. Closing as out of scope for 1.0: images aren't supported yet; they're planned in javascript-excel 2.x ([roadmap](https://github.com/securedeveloper/javascript-excel/blob/main/docs/api.md#13-roadmap-beyond-20)).
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#146** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 ships its own type declarations; no `@types` package is needed. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#147** (close):

> Fixed in react-data-export 1.0.0-alpha.1: nested data is a column `path`: `{ title: 'City', path: 'address[0].city' }`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#149** (close):

> Fixed in react-data-export 1.0.0-alpha.1: this crash was in the 0.x style code. 1.0 styles headers with `headerStyle` through javascript-excel's writer. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#150** (close):

> Fixed in react-data-export 1.0.0-alpha.1: sub headers are header groups: `{ title: 'Group', children: [...] }`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#151** (close):

> Fixed in react-data-export 1.0.0-alpha.1: a computed column handles arrays: `{ title: 'Phones', value: (r) => r.phone_nums.join(', ') }`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#152** (close):

> Fixed in react-data-export 1.0.0-alpha.1: `autoWidth: true` sizes columns from their text. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#153** (close):

> Fixed in react-data-export 1.0.0-alpha.1: javascript-excel compresses every part with deflate and uses a shared-strings table by default. If a 1.0 file is still much bigger than Excel's, please attach both files to a new issue. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#154** (close):

> Fixed in react-data-export 1.0.0-alpha.1: there's no row limit in 1.0. On the prerelease, 100,000 rows export and read back completely. If you hit a limit, please share the row and column counts in a new issue. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#155** (close):

> Fixed in react-data-export 1.0.0-alpha.1: conditional columns work: falsy entries in `columns` are skipped, e.g. `isAdmin && { title: 'Salary', key: 'salary' }`. With `react-data-export/legacy` (since 1.0.0-alpha.2), a falsy `<ExcelColumn>` child like the one in this report is skipped too. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#157** (close):

> Fixed in react-data-export 1.0.0-alpha.1: group titles are header groups (`children`), and `rightToLeft: true` flips the sheet. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#159** (close):

> Thanks for the report. Closing as out of scope for 1.0: this report is about `react-export-excel`, a separate fork that this project doesn't publish or maintain, so we can't fix its install. react-data-export 1.0 installs from npm without git.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#160** (close):

> Fixed in react-data-export 1.0.0-alpha.1: conditional sheets work: falsy entries in `workbook.sheets` are skipped. With `react-data-export/legacy` (since 1.0.0-alpha.2), a falsy `<ExcelSheet>` child like the one in this report is skipped too. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#162** (close):

> Fixed in react-data-export 1.0.0-alpha.1: `rightToLeft: true` on the sheet sets right-to-left column order. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#163** (close):

> Thanks for the report. Closing as out of scope for 1.0: legacy `.xls` (Excel 97–2003) isn't written by javascript-excel 2.0, the engine behind 1.0. It's on javascript-excel's [roadmap](https://github.com/securedeveloper/javascript-excel/blob/main/docs/api.md#13-roadmap-beyond-20) (4.x). `.xlsx` opens in every Excel version since 2007.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#164** (close):

> Fixed in react-data-export 1.0.0-alpha.1: use a column `path`: `{ title: 'Name', path: 'user.name' }`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#168** (close):

> Fixed in react-data-export 1.0.0-alpha.1: the `fs` import came from `tempa-xlsx`, which 1.0 no longer uses. CI now builds Vite, Next.js, Create React App (webpack 5) and React 17 + TypeScript apps against the packed package. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#169** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 doesn't depend on `xlsx` at all, so nothing extra is added to your `package.json`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#170** (keep open):

> Update for 1.0: 1.0's writer (javascript-excel) works in small chunks so the page stays responsive, and 100,000-row exports finish in well under a second in our measurements. Running the export in a Web Worker is planned for react-data-export 1.x; keeping this open until it ships.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#172** (close):

> Fixed in react-data-export 1.0.0-alpha.1: export an HTML table with `<ExportTableButton tableRef={ref} />` or `exportTable(ref)`; `colspan`/`rowspan` become merges. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#173** (close):

> Fixed in react-data-export 1.0.0-alpha.1: `cptable` came from the old `xlsx` fork. 1.0 has none of that code, and CI builds a Vite + React 19 app against the packed package. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#175** (close):

> Fixed in react-data-export 1.0.0-alpha.1: a label plus a summed total is `total: 'sum'` on the column and `totals: { label: 'Total' }` on the sheet. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#177** (close):

> Fixed in react-data-export 1.0.0-alpha.1: this was the old `tempa-xlsx` dynamic `require`. It's gone in 1.0, and a Vite app is part of CI. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#178** (close):

> Fixed in react-data-export 1.0.0-alpha.1: every export returns a promise, so several files from one click is `await Promise.all([exportDataset(a, { filename: 'a' }), exportDataset(b, { filename: 'b' })])`. Bundling them into one zip isn't part of the library. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#179** (close):

> Fixed in react-data-export 1.0.0-alpha.1: react-data-export 1.0 ships its own types (the import in the report is the separate `react-export-excel` fork, which this project doesn't publish). If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#181** (close):

> Fixed in react-data-export 1.0.0-alpha.1: the 0.x style docs are replaced by javascript-excel's style model; `alignment: { horizontal, vertical }` is documented there. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#182** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 doesn't use `jszip`; javascript-excel writes the zip container itself with the platform's `CompressionStream`. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

**#183** (close):

> Fixed in react-data-export 1.0.0-alpha.1: 1.0 is tested on React 17, 18 and 19 in CI, and you no longer import `xlsx` alongside it. If this still happens with 1.0, please open a new issue with a small example.
>
> react-data-export 1.0 is a rewrite on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0. Try the prerelease with `npm install react-data-export@next`; the [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) maps every 0.x pattern. 0.6.x stays on npm unchanged. Already have 0.x code? [`react-data-export/legacy`](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy) runs `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` on 1.0 with one import change (deprecated: supported for all of 1.x, removed in 2.0).

## 4. Follow-ups found while triaging

- **Side-by-side blocks (#134):** `fromDatasets` places a block next to the previous one only with a negative `offset.rows`. A clearer option (for example `offset: { beside: true }`) is a javascript-excel ticket.
- **Excel checks (#76, #94):** open a 1.0.0-alpha.1 single-sheet and multi-sheet file in Excel for Mac and Windows; close both issues with the result.
- **Bundle size (#110):** the bundler matrix (RDE-1.11) can record the size of a minimal app with and without react-data-export, so the comment can quote a measured number instead of `[placeholder]`.
- **Worker option (#170):** `ExportOptions.worker` on javascript-excel's `WorkerClient` (docs/api.md §7), for react-data-export 1.x.

