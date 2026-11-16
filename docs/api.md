# react-data-export 1.0: API design (dataset module)

Status: **design for review**. Nothing here is implemented yet. The code (RDE-1.9) is written against a published javascript-excel 2.0 prerelease that contains `fromDataset` and `javascript-excel/dom` (see [§9](#9-dependencies-and-order)).

This document covers module A, **dataset export**: `exportDataset`, `exportWorkbook`, `useExcelExport` and `<ExcelExport>`. Module B, table export (`exportTable`, `useTableExport`, `<ExportTableButton>`), gets its own section in a later change (RDE-1.17).

## Contents

1. [Principles](#1-principles)
2. [Entry point and packaging](#2-entry-point-and-packaging)
3. [The dataset shape](#3-the-dataset-shape)
4. [`exportDataset` and `exportWorkbook`](#4-exportdataset-and-exportworkbook)
5. [`useExcelExport`](#5-useexcelexport)
6. [`<ExcelExport>`](#6-excelexport)
7. [Errors, abort and progress](#7-errors-abort-and-progress)
8. [SSR and `"use client"`](#8-ssr-and-use-client)
9. [Dependencies and order](#9-dependencies-and-order)
10. [Feature coverage](#10-feature-coverage)
11. [From 0.x](#11-from-0x)
12. [Open questions](#12-open-questions)

---

## 1. Principles

- **javascript-excel does the work.** The `{ columns, data }` shape is javascript-excel's `Dataset<T>`, and building a sheet is `fromDataset` / `fromDatasets`. Writing is `toBlob` / `toCsvBlob`, and the download is `javascript-excel/dom`'s `download`. react-data-export adds no accessor logic, type coercion, styling, header layout, totals or width maths of its own. Anything a Vue or vanilla user would also want belongs in javascript-excel.
- **What react-data-export adds:**
  - one call that goes from data to a downloaded file
  - a promise for every export
  - React state (status, progress, error) with abort and unmount handling
  - a small component for the common "export button" case
- **Types are javascript-excel's.** Column, style and option types are re-exported, not redeclared, so a new javascript-excel option is available without a react-data-export release.
- **Nothing at import time.** No `window`, `document` or `Blob` access when the module loads (§8).
- **React 17, 18 and 19.** Only hooks that exist in React 17 are used: `useState`, `useRef`, `useCallback`, `useEffect`. No `react-dom` peer.

## 2. Entry point and packaging

One entry, `react-data-export`, ESM + CJS + `.d.ts`, `sideEffects: false`. It exports:

| export | kind | section |
|---|---|---|
| `exportDataset`, `exportWorkbook` | functions | §4 |
| `useExcelExport` | hook | §5 |
| `ExcelExport` | component | §6 |
| `isExcelError`, `sanitizeSheetName` | re-exports from `javascript-excel` | §7, §4.2 |
| `version` | `string` | |
| types: `Dataset`, `ColumnDef`, `LeafColumn`, `GroupColumn`, `DatasetOptions`, `Style`, `CellInput`, `CsvWriteOptions`, `WriteOptions`, `Progress`, `ExcelWarning` | type re-exports from `javascript-excel` (and `javascript-excel/csv`) | §3 |
| types: `ExportOptions`, `ExportFormat`, `ExportResult`, `WorkbookSpec`, `SheetSpec`, `ExportStatus`, `UseExcelExport`, `ExcelExportProps` | react-data-export's own | §4–§6 |

`javascript-excel` is a regular **dependency**, not a peer: users install `react-data-export` only. The `version` export stays, kept in sync by `npm run version-packages`. `useVersion`, the scaffold placeholder, is removed when the real API lands.

## 3. The dataset shape

`Dataset<T>` and its column types are exactly javascript-excel's (`docs/api.md` §4.3 in that repository):

```ts
import type { Dataset, ColumnDef, DatasetOptions } from 'react-data-export'; // = javascript-excel's

const people: Dataset<Person> = {
  columns: [
    { title: 'Name', key: 'name', width: 'auto' },
    { title: 'City', path: 'address.city' },
    { title: 'Joined', key: 'joined', type: 'date' },
    isAdmin && { title: 'Salary', key: 'salary', numFmt: '#,##0.00', total: 'sum' }, // falsy entries are skipped
    { title: 'Q1', children: [{ title: 'Jan', key: 'jan' }, { title: 'Feb', key: 'feb' }] }, // header group
    { title: 'Initials', value: (p) => p.name.split(' ').map((w) => w[0]).join('') },
  ],
  data: rows, // objects, or arrays picked by `index`
};
```

- **Accessors** are javascript-excel's four, with exactly one per leaf column:
  - `key`: an own property, taken literally
  - `path`: nested, e.g. `'items[0].name'`
  - `value(row, { rowIndex })`: computed
  - `index`: for array rows

  javascript-excel decided (its §12 Q18) that `key` and `path` stay separate fields, so `'a.b'` is never ambiguous. react-data-export passes them through unchanged rather than adding a combined field (see [Q7](#12-open-questions)).
- **Cells:** an accessor may return a bare value or a full cell, `{ value, style, formula, hyperlink }`.
- **Sheet-level options** are javascript-excel's `DatasetOptions`: `name`, `origin`, `header`, `headerStyle`, `freezeHeader`, `autoFilter`, `autoWidth`, `rightToLeft`, `totals`, `rowStyle`, `onWarning`.
- **Several blocks on one sheet** (what 0.x did with `xSteps`/`ySteps`) use javascript-excel's `fromDatasets`, exposed as `blocks` (§4.2).

## 4. `exportDataset` and `exportWorkbook`

Plain async functions. They don't depend on React and can be called from any event handler, and the hook and component are built on them.

### 4.1 Signatures

```ts
export type ExportFormat = 'xlsx' | 'csv';

export interface ExportOptions {
  /** File name. The extension for `format` is appended unless the name already ends with it. Default 'export'. */
  filename?: string;
  /** Default 'xlsx'. */
  format?: ExportFormat;
  /** Default true: start a browser download. false: only build the file and return it in the result. */
  download?: boolean;
  /** Passed to javascript-excel's toBlob (xlsx): compression, sharedStrings, dateZone, hyperlinkSchemes. */
  write?: Omit<WriteOptions, 'signal' | 'onProgress'>;
  /** Passed to javascript-excel's toCsvBlob (csv): delimiter, newline, quote, bom, escapeFormulas, dates, dateZone, formulas. */
  csv?: CsvWriteOptions;
  /** Workbook document properties (title, creator, ...); xlsx only. */
  properties?: DocProperties;
  signal?: AbortSignal;
  onProgress?: (p: Progress) => void;
}

export interface ExportResult {
  /** The file, as produced by toBlob / toCsvBlob. */
  blob: Blob;
  /** The final file name, extension included. */
  filename: string;
  format: ExportFormat;
  /** Warnings collected from fromDataset (COERCION_FAILED, NON_FINITE_NUMBER, ...); also delivered to onWarning. */
  warnings: ExcelWarning[];
}

export function exportDataset<T>(
  dataset: Dataset<T>,
  options?: ExportOptions & DatasetOptions<T>,
): Promise<ExportResult>;

export function exportWorkbook(spec: WorkbookSpec, options?: ExportOptions): Promise<ExportResult>;

export interface WorkbookSpec {
  /** Falsy entries are skipped (conditional sheets). At least one sheet must remain. */
  sheets: Array<SheetSpec<any> | null | false | undefined>;
  /** Index into the remaining sheets. Default 0. */
  activeSheet?: number;
}

/** One sheet: a single dataset, or several stacked blocks. */
export type SheetSpec<T> =
  | (Dataset<T> & DatasetOptions<T>)
  | ({ blocks: Array<Dataset<any> & { offset?: { rows?: number; cols?: number } }> } & DatasetOptions<any> & { gap?: number });
```

### 4.2 Behaviour

Each step is a javascript-excel call:

1. **Build.** `exportDataset(ds, opts)` calls `fromDataset(ds, opts)`. `exportWorkbook` calls `fromDataset` for each remaining sheet, or `fromDatasets(blocks, opts)` for a sheet with `blocks`, in order. `onWarning` (from `DatasetOptions`) still fires, and warnings are also collected into `result.warnings`.
2. **Write.**
   - xlsx: `toBlob({ sheets, activeSheet, properties }, { ...write, signal, onProgress })`.
   - csv: `toCsvBlob(sheet, csv)`.

   CSV is one sheet by definition: `exportWorkbook` with `format: 'csv'` and more than one remaining sheet rejects with a `TypeError` before anything is built ([Q2](#12-open-questions)).
3. **Download** (unless `download: false`): `download(blob, filename)` from `javascript-excel/dom`.
4. **Resolve** with `ExportResult`.

Details:

- **When the promise resolves.** After the download has been *started*: the browser has been asked to save the file. No browser API reports whether the user actually kept it, so "exported" means the file was built and handed to the browser.
- **Several files from one click** (#89, #178) is plain promise composition. Calls are independent, and each makes its own file:

  ```ts
  await Promise.all([exportDataset(a, { filename: 'a' }), exportDataset(b, { filename: 'b', format: 'csv' })]);
  ```
- **Filename.**
  - `'report'` with xlsx gives `report.xlsx`; `'report.xlsx'` stays as it is; `'report.csv'` with xlsx gives `report.csv.xlsx`. The format decides the extension, never the name.
  - No other changes are made, and browsers sanitise `download` names themselves.
  - An empty name, after trimming, falls back to `'export'`.
- **Sheet names.** An invalid name throws `INVALID_SHEET_NAME`, as in javascript-excel (its §12 Q19). Callers with user-supplied names use the re-exported `sanitizeSheetName`.
- **Validation** happens in javascript-excel. A bad column definition throws `INVALID_COLUMN` from `fromDataset`, and invalid workbook input throws `ValidationError` from the writer. The promise rejects with that error, unchanged.
- **Without a DOM** (SSR, tests without jsdom, workers), `download: true` rejects with javascript-excel's `ENVIRONMENT_UNSUPPORTED`, and `download: false` works. For server-side file generation, use javascript-excel directly (`fromDataset` + `toUint8Array`); react-data-export is for the browser.

## 5. `useExcelExport`

```ts
export type ExportStatus = 'idle' | 'exporting' | 'done' | 'error';

export interface UseExcelExport {
  exportDataset<T>(dataset: Dataset<T>, options?: ExportOptions & DatasetOptions<T>): Promise<ExportResult>;
  exportWorkbook(spec: WorkbookSpec, options?: ExportOptions): Promise<ExportResult>;
  status: ExportStatus;
  /** Latest progress of the running export(s); null when idle. */
  progress: Progress | null;
  /** The error of the last failed export (aborts excluded); cleared when a new export starts. */
  error: unknown;
  /** The result of the last successful export. */
  result: ExportResult | null;
  /** Abort every running export started from this hook. */
  abort(reason?: unknown): void;
}

export function useExcelExport(defaults?: ExportOptions): UseExcelExport;
```

- **Thin wrapper.** The returned `exportDataset` and `exportWorkbook` are the §4 functions with `defaults` merged under the call's options. They return the same promise, so `await exportDataset(...)` works inside a handler, as do `onExported`/`onError`-style flows.
- **Stable identities.** The functions and `abort` keep their identity across renders (`useCallback` with refs), so they are safe in dependency arrays.
- **State.**
  - `status` is `'exporting'` while at least one export started from this hook is running.
  - After the last one settles, `status` is `'done'` or `'error'`, from the most recently *started* export.
  - Starting a new export clears `error`.
- **Abort.**
  - Each call gets its own `AbortController`, linked to `options.signal` if one is given.
  - `abort()` aborts all of them. An aborted export rejects with `signal.reason`, as `fetch` does, and doesn't set `error` or `status: 'error'`: aborting is not a failure. The status returns to `'idle'`.
- **Unmount.**
  - Running exports are aborted when the component unmounts, so no state update happens after unmount, and a large export doesn't keep running for a screen that is gone ([Q4](#12-open-questions)).
  - Under React 18/19 StrictMode, development mounts, unmounts and remounts effects. The hook tracks "mounted" in an effect (set on mount, cleared on cleanup), so the extra cycle doesn't abort exports started after the final mount.
- **Auto-export on mount** (0.x `hideElement`) is a recipe, not a prop:

  ```tsx
  const { exportDataset } = useExcelExport();
  useEffect(() => { void exportDataset(ds, { filename: 'report' }); }, []);
  ```

  Browsers may block a download that doesn't follow a user gesture. The migration guide says so.

## 6. `<ExcelExport>`

For the common "a button that exports this data" case:

```ts
export type ExcelExportProps = ExportOptions & {
  /** What to export: one dataset or a workbook. Exactly one. */
  dataset?: Dataset<any> & DatasetOptions<any>;
  workbook?: WorkbookSpec;
  onExported?: (result: ExportResult) => void;
  onError?: (error: unknown) => void;
  /**
   * Render prop: receives the trigger and the hook state. Without children, a
   * default <button type="button"> labelled "Export" is rendered (disabled while exporting).
   * A string or element child is used as the default button's label.
   */
  children?: ReactNode | ((api: { run(): Promise<ExportResult | undefined>; status: ExportStatus; progress: Progress | null }) => ReactNode);
};

export function ExcelExport(props: ExcelExportProps): ReactElement;
```

```tsx
<ExcelExport dataset={people} filename="people" onExported={(r) => toast(`Saved ${r.filename}`)}>
  Download people.xlsx
</ExcelExport>

<ExcelExport workbook={{ sheets: [summary, details] }} format="xlsx">
  {({ run, status }) => <MyButton onClick={run} loading={status === 'exporting'}>Export</MyButton>}
</ExcelExport>
```

- It uses `useExcelExport` internally. `run()` exports with the current props.
  - `run()` resolves with the result, or `undefined` after an error or abort. It never rejects, so `onClick={run}` can't cause an unhandled rejection.
  - Errors go to `onError`. With no `onError`, they go to `console.error`, so they're never lost.
- It renders no wrapper element, only the default button or what the render prop returns.
- The data props are read when the export starts. Changing them while an export runs doesn't affect that export.
- Passing both `dataset` and `workbook`, or neither, is a `TypeError` when `run()` is called, and in development a `console.error` at render.
- No `element` cloning (0.x's `element` prop). The render prop covers custom triggers without injecting `onClick` into arbitrary elements ([Q5](#12-open-questions)).

## 7. Errors, abort and progress

- **Errors are javascript-excel's.**
  - `ValidationError` (`INVALID_COLUMN`, `INVALID_SHEET_NAME`, `INVALID_NUMBER`, …), `EnvironmentError` (`ENVIRONMENT_UNSUPPORTED`) and `LimitError` come through unchanged.
  - Check them with the re-exported `isExcelError(err)` or `err.code`, not `instanceof`: javascript-excel ships ESM and CJS, and the two copies' classes differ.
  - react-data-export's own misuse errors (CSV with several sheets, `dataset` and `workbook` both or neither, an unknown `format`) are `TypeError`s. That's how javascript-excel treats invalid options too.
- **Abort.** `signal` reaches `toBlob`, which checks it between sheet chunks. It is also checked before building and before the download starts. An abort rejects with `signal.reason` (a `DOMException` `AbortError` by default). `toCsvBlob` is synchronous, so a CSV export can only be aborted before it starts.
- **Progress.** `onProgress` receives javascript-excel's `Progress` (`phase`, `sheet`, `ratio` from 0 to 1, non-decreasing) from `toBlob`. The building phase (`fromDataset`) is synchronous and reports nothing, so the first progress event comes from the writer. CSV reports no progress.
- **Big data.** Large exports run on the main thread in 1.0. Off-main-thread writing comes with javascript-excel's worker entry (its JSE-8):
  - `fromDataset` has to run on the main thread, because accessors are functions and can't be sent to a worker.
  - The resulting sheet is plain data, and can be written in a worker.
  - When JSE-8 ships, `ExportOptions` gains `worker?: WorkerClient`. That is additive, not a breaking change. Until then this is listed under 1.x, not 1.0.

## 8. SSR and `"use client"`

- **Import is side-effect free.** Neither the package nor its javascript-excel imports touch `window`, `document`, `Blob` or `URL` at module load. javascript-excel guarantees this for its entries, including `javascript-excel/dom`, which throws only when `download` is called without a DOM. So the package can be imported in SSR (Next.js pages, Remix, Astro) and in Node tests.
- **`"use client"`.**
  - The built entry starts with the `"use client"` directive. `useExcelExport` and `<ExcelExport>` use hooks and event handlers, so in the React Server Components model they are client code. The directive lets a Server Component import and render `<ExcelExport>` directly, without a wrapper file.
  - `exportDataset`/`exportWorkbook` live in the same entry. Called from a Server Component they're client references and can't run on the server. That's intended, because the download is browser-only. Server-side generation uses javascript-excel (§4.2).
  - Under React 17/18 without RSC, the directive is an ignored string literal.
  - **To verify in RDE-1.9:** that tsdown keeps the directive at the top of both `index.js` and `index.cjs` (bundlers can drop module-level directives, and a `banner` is the fallback), with a test that checks the built files. RDE-1.11's bundler matrix (Next.js App Router) then checks it end to end.
- **Hydration.** `<ExcelExport>` renders the same markup on server and client: the default button, `disabled` only while exporting, and exporting only happens on the client.

## 9. Dependencies and order

| needs | from javascript-excel | status today |
|---|---|---|
| `Dataset`, `ColumnDef`, `DatasetOptions`, `fromDataset`, `fromDatasets` | core entry, its §4.3 | **specified, not implemented yet**; not in 2.0.0-alpha.1 |
| `toBlob`, `WriteOptions`, `Progress`, `DocProperties`, `isExcelError`, `sanitizeSheetName` | core entry, §5.1 / §4.6 / §7 | implemented (2.0.0-alpha.1) |
| `toCsvBlob`, `CsvWriteOptions` | `javascript-excel/csv`, §5.3 | implemented (2.0.0-alpha.1) |
| `download` | `javascript-excel/dom`, §5.4 | in progress (JSE-7) |
| `WorkerClient` (1.x only) | `javascript-excel/worker`, §5.5 | planned (JSE-8) |

So the RDE-1.9 code starts once a javascript-excel prerelease with `fromDataset`/`fromDatasets` and `download` is on npm. react-data-export then depends on that exact prerelease line, for example `"javascript-excel": "^2.0.0-alpha.N"`. Until then, only this design and its review happen. Writing a temporary `fromDataset` in React would duplicate the engine, which the principles rule out.

## 10. Feature coverage

The 1.0 feature list, and where each one comes from:

| feature (issues) | how |
|---|---|
| Header groups / merged header cells (#96 #98 #87 #127) | `GroupColumn` (`children`), by `fromDataset` |
| Auto column width (#152 #129) | `width: 'auto'` per column or `autoWidth` per sheet, by `fromDataset` |
| Freeze header row, autofilter | `freezeHeader`, `autoFilter` (`DatasetOptions`) |
| Number/date/currency formats, per-column type (#139 #111) | `numFmt`, `type` on columns |
| Conditional sheets/columns (#155 #160, PR #176) | falsy `columns` entries (javascript-excel); falsy `sheets` entries (§4.1, react-data-export) |
| Several files from one click, done callback (#89 #178, PR #167) | promise API (§4.2), `onExported` (§6) |
| Totals row / formulas, hyperlinks (#103 #99 #175) | `total` on columns; cells with `formula` / `hyperlink` |
| RTL sheets (#109 #162 #157) | `rightToLeft` (`DatasetOptions`) |
| CSV options: delimiter, BOM, injection guard (#138) | `format: 'csv'` + `csv` (`CsvWriteOptions`); the injection guard is on by default |
| Big data: progress, `AbortSignal` (#154 #170 #153) | `onProgress`, `signal`, hook `abort()`; worker in 1.x (§7) |
| SSR-safe, no `window` at import (#168 family) | §8 |

## 11. From 0.x

A preview of the mapping. The full side-by-side guide is RDE-1.12, and 0.6.x stays on npm unchanged.

| 0.x | 1.0 |
|---|---|
| `<ExcelFile filename element>` + `<ExcelSheet name>` + `<ExcelColumn label value>` | `<ExcelExport workbook={{ sheets: [{ name, columns: [{ title: label, key: value }], data }] }} filename>` |
| `<ExcelColumn value={(row) => …}>` | `{ title, value: (row) => … }` |
| `dataSet={[{ columns: ['A', 'B'], data: [[…], …] }]}` | `{ columns: [{ title: 'A' }, { title: 'B' }], data: [[…], …] }`: array rows are picked by position |
| `dataSet` with `xSteps` / `ySteps` | sheet `blocks` with `offset: { cols, rows }` (`fromDatasets`) |
| `hideElement` | `useExcelExport` + `useEffect` (§5) |
| `element={<button>…</button>}` | `children` (label) or the render prop (§6) |
| `fileExtension="xlsx"` | `format: 'xlsx' \| 'csv'` |
| cell `{ value, style }` with xlsx-style keys (`font.sz`, `fill.fgColor.rgb`) | cell `{ value, style }` with javascript-excel's style keys (its §11.3 table: `font.size`, `fill: 'RRGGBB'`, …) |

## 12. Open questions

Each one has a recommendation. Decided answers move into the sections above.

- **Q1. Extension handling.** Append the format's extension unless the name already ends with it (§4.2). *Recommended.* Alternative: always use the name as given.
- **Q2. CSV with several sheets.** Reject with a `TypeError` (§4.2). *Recommended*, because a CSV file has one table. Alternatives: one file per sheet (several downloads from one call), or a zip of CSVs (a new dependency on zip writing, which javascript-excel keeps internal).
- **Q3. `"use client"` on the whole entry** (§8). *Recommended.* Alternative: a separate `react-data-export/core` entry without the directive, for the plain functions. It's only useful if someone needs `exportDataset(…, { download: false })` in a server context, where javascript-excel itself is the better fit.
- **Q4. Abort running exports on unmount** (§5). *Recommended* as the default. Alternative: let them finish and only skip state updates, or make it an option (`abortOnUnmount`).
- **Q5. `<ExcelExport>` triggers: render prop plus default button, no `cloneElement`** (§6). *Recommended.* Alternative: 0.x-style `element` that gets an injected `onClick`. That's fragile with components that don't forward `onClick` or that are fragments.
- **Q6. Dependency range on javascript-excel during the 2.0 prereleases.** `^2.0.0-alpha.N` (caret on a prerelease only matches later prereleases of 2.0.0 and 2.0.0 itself). *Recommended.* Alternative: an exact pin, bumped with each alpha.
- **Q7. Accessor fields.** Pass javascript-excel's `key` / `path` / `value` / `index` through unchanged (§3). *Recommended*: one documented shape for every framework, and no ambiguity about `'a.b'`. Alternative: a single react-data-export field that accepts both keys and paths and maps to `key` or `path`. javascript-excel's Q18 allows this, but it adds a translation layer and an ambiguity.
