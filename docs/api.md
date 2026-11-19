# react-data-export 1.0: API design (dataset module)

Status: **design decided (2026-11-16); the dataset module is implemented** (RDE-1.9) on **javascript-excel ≥ 2.0.0** (see [§9](#9-dependencies-and-order)), and ships in the 1.0 prereleases on npm's `next` tag. The 1.0 feature set is complete: until 1.0.0, changes are limited to fixes found in testing. Table export (module B, [§13](#13-table-export)) is designed and implemented in RDE-1.17.

This document covers module A, **dataset export** (`exportDataset`, `exportWorkbook`, `useExcelExport`, `<ExcelExport>`), and module B, **table export** (`exportTable`, `useTableExport`, `<ExportTableButton>`, [§13](#13-table-export)).

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
12. [Design decisions](#12-design-decisions)
13. [Table export](#13-table-export)

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
| `exportTable`, `useTableExport`, `ExportTableButton` | function, hook, component | §13 |
| `isExcelError`, `sanitizeSheetName` | re-exports from `javascript-excel` | §7, §4.2 |
| `version` | `string` | |
| **`react-data-export/legacy`** (a separate entry): `ExcelFile`, `ExcelSheet`, `ExcelColumn`, the 0.x default export, `convertLegacyStyle` | **deprecated** 0.x components on this API; removed in 2.0 | [migration.md §1.1](migration.md#11-quick-path-react-data-exportlegacy) |
| types: `Dataset`, `ColumnDef`, `LeafColumn`, `GroupColumn`, `DatasetOptions`, `Style`, `CellInput`, `CsvWriteOptions`, `WriteOptions`, `Progress`, `ExcelWarning` | type re-exports from `javascript-excel` (and `javascript-excel/csv`) | §3 |
| types: `ExportOptions`, `ExportFormat`, `ExportResult`, `WorkbookSpec`, `SheetSpec`, `ExportStatus`, `UseExcelExport`, `ExcelExportProps` | react-data-export's own | §4–§6 |
| types: `FromTableOptions`, `TableElement`, `TableCellElement` | type re-exports from `javascript-excel/dom` | §13 |
| types: `TableRef`, `TableTarget`, `UseTableExport`, `ExportTableButtonProps` | react-data-export's own | §13 |

`javascript-excel` is a regular **dependency**, not a peer: users install `react-data-export` only. The `version` export stays, kept in sync by `npm run version-packages`. `useVersion`, the scaffold placeholder, was removed when the dataset module landed (RDE-1.9).

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

  javascript-excel decided (its §12 Q18) that `key` and `path` stay separate fields, so `'a.b'` is never ambiguous. react-data-export passes them through unchanged rather than adding a combined field (see [Q7](#12-design-decisions)).
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

   CSV is one sheet by definition: `exportWorkbook` with `format: 'csv'` and more than one remaining sheet rejects with a `TypeError` before anything is built ([Q2](#12-design-decisions)).
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
  - Running exports are aborted when the component unmounts, so no state update happens after unmount, and a large export doesn't keep running for a screen that is gone ([Q4](#12-design-decisions)).
  - Under React 18/19 StrictMode, development mounts, unmounts and remounts effects. The hook tracks "mounted" in an effect (set on mount, cleared on cleanup), so the extra cycle doesn't abort exports started after the final mount.
- **Auto-export on mount** (0.x `hideElement`) is a recipe, not a prop:

  ```tsx
  const { exportDataset } = useExcelExport();
  useEffect(() => {
    exportDataset(ds, { filename: 'report' }).catch(() => {}); // aborted on unmount
  }, [exportDataset]);
  ```

  Under StrictMode in development, React's simulated unmount aborts the first run (the hook aborts on unmount) and the remount starts it again. That is why the recipe handles the rejection. Browsers may block a download that doesn't follow a user gesture. The migration guide says so.

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
- No `element` cloning (0.x's `element` prop). The render prop covers custom triggers without injecting `onClick` into arbitrary elements ([Q5](#12-design-decisions)).

## 7. Errors, abort and progress

- **Errors are javascript-excel's.**
  - `ValidationError` (`INVALID_COLUMN`, `INVALID_SHEET_NAME`, `INVALID_NUMBER`, …), `EnvironmentError` (`ENVIRONMENT_UNSUPPORTED`) and `LimitError` come through unchanged.
  - Check them with the re-exported `isExcelError(err)` or `err.code`, not `instanceof`: javascript-excel ships ESM and CJS, and the two copies' classes differ.
  - react-data-export's own misuse errors (CSV with several sheets, `dataset` and `workbook` both or neither, an unknown `format`) are `TypeError`s. That's how javascript-excel treats invalid options too.
- **Abort.** `signal` reaches `toBlob`, which checks it between sheet chunks. It is also checked before building and before the download starts. Every export starts by yielding once (one microtask) and re-checking the signal before it builds anything. `toCsvBlob` is synchronous, so without that yield a CSV export started in an effect would finish, download included, before React 18/19 StrictMode's simulated unmount could abort it, and the documented auto-export recipe would save the file twice in development. An abort rejects with `signal.reason` (a `DOMException` `AbortError` by default). `toCsvBlob` is synchronous, so a CSV export can only be aborted before it starts.
- **Progress.** `onProgress` receives javascript-excel's `Progress` (`phase`, `sheet`, `ratio` from 0 to 1, non-decreasing) from `toBlob`. The building phase (`fromDataset`) is synchronous and reports nothing, so the first progress event comes from the writer. CSV reports no progress.
- **Big data: the main thread stays responsive.** In 1.0, exports run on the main thread. From javascript-excel 2.0.0-alpha.7 (react-data-export depends on 2.0.0 or later, §9), `toBlob` returns to the event loop about every 16 ms while it writes. So a large `.xlsx` export doesn't freeze the page: frames render, input is handled, and `abort()` or an aborted `signal` takes effect while the file is being written. The output bytes are the same as without the pauses. Building the sheet (`fromDataset`, `fromTable`) and writing CSV (`toCsvBlob`) are still synchronous.
- **Worker: 1.x, not 1.0** (decided 2026-11-17). javascript-excel's worker entry, `javascript-excel/worker` (its §5.5), has existed since 2.0.0-alpha.1. react-data-export adds it after 1.0.0, in a 1.x minor release:
  - `fromDataset` and `fromTable` have to run on the main thread: accessors are functions and can't be sent to a worker, and the table is in the page.
  - The resulting sheet is plain data, and can be written in a worker.
  - `ExportOptions` gains `worker?: WorkerClient`. That's additive, not a breaking change, so it doesn't have to wait for 2.0.

## 8. SSR and `"use client"`

- **Import is side-effect free.** Neither the package nor its javascript-excel imports touch `window`, `document`, `Blob` or `URL` at module load. javascript-excel guarantees this for its entries, including `javascript-excel/dom`, which throws only when `download` is called without a DOM. So the package can be imported in SSR (Next.js pages, Remix, Astro) and in Node tests.
- **`"use client"`.**
  - The built entry starts with the `"use client"` directive. `useExcelExport` and `<ExcelExport>` use hooks and event handlers, so in the React Server Components model they are client code. The directive lets a Server Component import and render `<ExcelExport>` directly, without a wrapper file.
  - `exportDataset`/`exportWorkbook` live in the same entry. Called from a Server Component they're client references and can't run on the server. That's intended, because the download is browser-only. Server-side generation uses javascript-excel (§4.2).
  - Under React 17/18 without RSC, the directive is an ignored string literal.
  - **To verify in RDE-1.9:** that tsdown keeps the directive at the top of both `index.js` and `index.cjs` (bundlers can drop module-level directives, and a `banner` is the fallback), with a test that checks the built files. RDE-1.11's bundler matrix (Next.js App Router) then checks it end to end.
- **Hydration.** `<ExcelExport>` renders the same markup on server and client: the default button, `disabled` only while exporting, and exporting only happens on the client.

## 9. Dependencies and order

| needs | from javascript-excel | available since |
|---|---|---|
| `Dataset`, `ColumnDef`, `DatasetOptions`, `fromDataset`, `fromDatasets` | core entry, its §4.3 | 2.0.0-alpha.2 (JSE-14) |
| `toBlob`, `WriteOptions`, `Progress`, `DocProperties`, `isExcelError`, `sanitizeSheetName` | core entry, §5.1 / §4.6 / §7 | 2.0.0-alpha.1 |
| `toCsvBlob`, `CsvWriteOptions` | `javascript-excel/csv`, §5.3 | 2.0.0-alpha.1 |
| `download` | `javascript-excel/dom`, §5.4 | 2.0.0-alpha.1 (JSE-7) |
| `fromTable`, `FromTableOptions`, `TableElement` (§13) | `javascript-excel/dom`, §5.4 | 2.0.0-alpha.1 (JSE-7) |
| `toBlob` returning to the event loop while it writes (§7) | core entry, §5.1 | 2.0.0-alpha.7 |
| `WorkerClient` (1.x only, §7) | `javascript-excel/worker`, §5.5 | 2.0.0-alpha.1 (JSE-8) |

So react-data-export depends on `"javascript-excel": "^2.0.0"` ([Q6](#12-design-decisions)), the stable 2.0 release. 2.0.0-alpha.2 was the first prerelease with `fromDataset`/`fromDatasets`, and 2.0.0-alpha.7 the first whose writer yields to the browser. Nothing in react-data-export reimplements them.

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
| Big data: progress, `AbortSignal` (#154 #170 #153) | `onProgress`, `signal`, hook `abort()`; the writer yields to the browser on the main thread; worker in 1.x (§7) |
| SSR-safe, no `window` at import (#168 family) | §8 |
| Export an HTML table (#172) | `exportTable`, `useTableExport`, `<ExportTableButton>` over `fromTable` (§13) |

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

## 12. Design decisions

These were the open questions of the review. Each one is decided, and the sections above state the outcome as the design. The numbering is kept stable, so references such as "§12 Q4" stay valid.

**Q1. Extension handling.** Decided (2026-11-16): the format's extension is appended unless the name already ends with it, and the format always decides the extension (§4.2). The alternative, always using the name as given, was not taken.

**Q2. CSV with several sheets.** Decided (2026-11-16): `exportWorkbook` with `format: 'csv'` and more than one remaining sheet rejects with a `TypeError` before anything is built (§4.2), because a CSV file holds one table. Not taken: one file per sheet (several downloads from one call), and a zip of CSVs (which would need zip writing that javascript-excel keeps internal).

**Q3. `"use client"` scope.** Decided (2026-11-16): the directive goes on the whole entry (§8). There is no separate `react-data-export/core` entry. Server-side generation uses javascript-excel directly.

**Q4. Running exports on unmount.** Decided (2026-11-16): `useExcelExport` aborts its running exports when the component unmounts, StrictMode-safe (§5). Not taken: letting them finish while only skipping state updates, and an `abortOnUnmount` option.

**Q5. `<ExcelExport>` triggers.** Decided (2026-11-16): a default button or a render prop, with no `cloneElement` (§6). The 0.x-style `element` with an injected `onClick` is not carried over, because it breaks with components that don't forward `onClick` and with fragments.

**Q6. javascript-excel range during the 2.0 prereleases.** Decided (2026-11-16): a caret range on a prerelease, `"javascript-excel": "^2.0.0-alpha.2"` at the time, then `^2.0.0-beta.0`, and `^2.0.0` since javascript-excel 2.0.0 shipped on 2026-11-19 (§9). A caret on a prerelease matches only later 2.0.0 prereleases and 2.0.0 itself. An exact pin bumped with each alpha was not taken.

**Q7. Accessor fields.** Decided (2026-11-16): javascript-excel's `key` / `path` / `value` / `index` pass through unchanged (§3). That gives one documented shape for every framework and no ambiguity about `'a.b'`. A combined react-data-export field mapped to `key` or `path`, which javascript-excel's Q18 would allow, was not taken.

## 13. Table export

Module B exports an HTML `<table>` that is already on the page. It is the same thin layer as module A. `fromTable` from `javascript-excel/dom` reads the table, `toBlob` or `toCsvBlob` writes it, and `download` saves it. Reading tables (structure, merges, hints, hidden rows, links, styles) is javascript-excel's job (its §5.4), so it isn't repeated here.

### 13.1 Signatures

```ts
import type { FromTableOptions, TableElement } from 'javascript-excel/dom';

/** Anything with a `current` table, e.g. the object from useRef<HTMLTableElement>(null). */
export interface TableRef { readonly current: TableElement | null }
export type TableTarget = TableElement | TableRef;

export function exportTable(table: TableTarget, options?: ExportOptions & FromTableOptions): Promise<ExportResult>;

export interface UseTableExport {
  /** Exports the table the ref points to when it is called. */
  exportTable(options?: ExportOptions & FromTableOptions): Promise<ExportResult>;
  status: ExportStatus;
  progress: Progress | null;
  error: unknown;
  result: ExportResult | null;
  abort(reason?: unknown): void;
}
export function useTableExport(ref: TableRef, defaults?: ExportOptions & FromTableOptions): UseTableExport;

export type ExportTableButtonProps = ExportOptions & FromTableOptions & {
  tableRef: TableRef;
  onExported?: (result: ExportResult) => void;
  onError?: (error: unknown) => void;
  children?: ReactNode | ((api: { run(): Promise<ExportResult | undefined>; status: ExportStatus; progress: Progress | null }) => ReactNode);
};
export function ExportTableButton(props: ExportTableButtonProps): ReactElement;
```

```tsx
const ref = useRef<HTMLTableElement>(null);
<table ref={ref}>…</table>
<ExportTableButton tableRef={ref} filename="orders" freezeHeader autoWidth>Export orders</ExportTableButton>
```

### 13.2 Behaviour

- **Options pass through unchanged.** Everything that isn't an `ExportOptions` key goes to `fromTable` as it is: `name`, `header`, `headerStyle`, `includeFooter`, `skipHidden`, `ignore`, `styles`, `inferTypes`, `links`, `hyperlinkSchemes`, `freezeHeader`, `autoFilter`, `autoWidth`, `cell` and `onWarning`. The defaults are javascript-excel's: `<thead>` rows are bold headers, `colspan`/`rowspan` become merges, hidden and `[data-export-ignore]` rows and cells are skipped, and `data-type`/`data-value`/`data-numfmt` hints are honoured. A new `fromTable` option works without a react-data-export release, since the types are re-exported.
- **The result shape is shared** with `exportDataset`: `{ blob, filename, format, warnings }`. `warnings` collects `fromTable`'s warnings (`COERCION_FAILED`, `HYPERLINK_DROPPED`), which also still reach `onWarning`. Filename, format, `download`, `write`, `csv`, `properties`, `signal` and `onProgress` behave as in §4.2. CSV keeps the values and drops merges and styles, as `toCsvBlob` does.
- **Refs.**
  - `exportTable` accepts the element or a ref, and reads `ref.current` when it is called.
  - The hook and the component take a ref, which is read when the export starts, never at render. That's when the table is guaranteed to be mounted, and it always exports the table's current contents.
  - `TableRef` is structural (`{ readonly current }`), so `useRef<HTMLTableElement>(null)` from @types/react 17, 18 and 19 fits without depending on any of them.
  - **Callback refs are not supported.** Use an object ref.
  - **An empty ref** (`current` is `null`: not rendered yet, or unmounted) rejects with a `TypeError` before anything is built.
- **Order of checks:** the format, then the signal, one yield (§7), the signal again, then the element, build, write, the signal again, and the download.
- **SSR.** Importing stays side-effect free. On the server there's no table, so a table export can only start in the browser. Exporting from a server render is not a use case: the table is in the user's DOM.
- **Hook and component:** these are `useExcelExport` and `<ExcelExport>` with a ref instead of data. They share the same state, abort and unmount behaviour (§5) and the same trigger and `run()` contract (§6), through one internal implementation, so the two can't drift. Unlike `<ExcelExport>`, `<ExportTableButton>` always has its single target, `tableRef`, so there's no "exactly one of" check.
- **Errors** are javascript-excel's, unchanged (§7), for example `INVALID_SHEET_NAME` for a bad `name`.

