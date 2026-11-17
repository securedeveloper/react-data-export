# react-data-export

## 1.0.0-beta.0

First beta of 1.0.0, on the `next` dist-tag. The 1.0 feature set is complete: everything in the 1.0.0-alpha releases below. Until 1.0.0, changes are limited to fixes found in testing. The Web Worker option (`worker`, on `javascript-excel/worker`) comes in a 1.x release, not in 1.0. Until then the main-thread writer yields to the browser, so large exports keep the page responsive. The 0.x API (`<ExcelFile>`, `<ExcelSheet>`, `<ExcelColumn>`) runs on 1.0 through the deprecated `react-data-export/legacy` entry (removed in 2.0); see the migration guide. 0.6.0 stays on `latest` until 1.0.0. Bundle size: in a Vite + React 19 production build, 1.0 adds 24.7 KiB gzip for `exportDataset` and 31.5 KiB with every export, against 266.3 KiB for 0.6.0's `<ExcelFile>` (measured with the bundler matrix's `bundle-size` fixture).

### Patch Changes

- f48b7b6: README: the 1.0 feature set is complete; until 1.0.0, changes are limited to fixes found in testing. A Web Worker option comes in a 1.x release.
- f48b7b6: Depend on javascript-excel `^2.0.0-beta.0`, its first 2.0.0 beta. Since 2.0.0-alpha.7 its writer returns to the event loop about every 16 ms, so a large `.xlsx` export on the main thread no longer freezes the page, and `signal`/`abort()` take effect while it runs.

## 1.0.0-alpha.3

### Patch Changes

- 1a36b62: `react-data-export/legacy`: two `<ExcelSheet>` elements with the same name (compared case-insensitively) no longer fail the export; the later ones are written as `name (2)`, `name (3)`... with a development warning. 0.x wrote such files as given, and Excel offered to repair them (#94).
- 3ce8219: README: the 0.6 API is described as shipping only in the deprecated `react-data-export/legacy` entry (removed in 2.0), and the playground is linked.

## 1.0.0-alpha.2

### Minor Changes

- 986d0d7: Add `react-data-export/legacy`, a deprecated quick path for 0.x code: `<ExcelFile>`, `<ExcelSheet>`, `<ExcelColumn>`, the 0.x default export (`import ReactExport from 'react-data-export/legacy'`), the `dataSet` shape with `xSteps`/`ySteps`, and xlsx-style cell styles, built on 1.0's export code and javascript-excel. The files it writes match 0.6.0's (checked against the real 0.6.0):
  - plain `<ExcelColumn>` headers and bold `dataSet` headers
  - 80 px default widths
  - UTC dates
  - the `Download` default name with the extension always appended
  - the `<span>` trigger wrapper
  
  0.6's bugs stay fixed:
  - one download under StrictMode
  - `fileExtension: 'csv'` writes real CSV
  - `xls`/`txt`/`html` write `.xlsx` with a warning
  - string `dataSet` columns keep their header text
  - falsy children are skipped
  
  `convertLegacyStyle` converts 0.x styles to the 1.0 style model. The entry is supported for all of 1.x and removed in 2.0, and it logs one deprecation warning in development. It's a separate entry, so the main entry's bundle doesn't include it.

### Patch Changes

- da0941a: Depend on javascript-excel `^2.0.0-alpha.3`.

## 1.0.0-alpha.1

### Minor Changes

- 05a07db: Add the 1.0 dataset module, built on javascript-excel 2.0:
  - `exportDataset(dataset, options)` and `exportWorkbook({ sheets, activeSheet }, options)` build sheets with javascript-excel's `fromDataset`/`fromDatasets`, write `.xlsx` (`toBlob`) or `.csv` (`toCsvBlob`) and download through `javascript-excel/dom`. They resolve with `{ blob, filename, format, warnings }`. Falsy sheets are skipped, `download: false` only builds the file, and `signal`/`onProgress` are supported.
  - `useExcelExport(defaults)` adds `status`, `progress`, `error` and `result`, stable functions, `abort()`, and aborts running exports on unmount (StrictMode-safe).
  - `<ExcelExport dataset | workbook>` renders a default button or a render prop with a `run()` that never rejects, and reports through `onExported`/`onError`.
  - The entry is marked `"use client"`. The dataset, column, style and option types are javascript-excel's own, re-exported (`Dataset`, `ColumnDef`, `LeafColumn`, `GroupColumn`, `DatasetBlock`, `DatasetOptions`, `Style`, `CellInput`, `WriteOptions`, `CsvWriteOptions`, `Progress`, `ExcelWarning`, `DocProperties`), along with `isExcelError` and `sanitizeSheetName`.
  
  The scaffold placeholder `useVersion` is removed.
- e4e9492: Add table export, built on javascript-excel 2.0's `fromTable`:
  - `exportTable(tableOrRef, options)` reads an HTML `<table>` (an element, or a ref read when called). `colspan`/`rowspan` become merges, `<thead>` rows become headers, hidden and `[data-export-ignore]` rows are skipped, and `data-*` hints are honoured. It exports `.xlsx` or `.csv` with the same options and the same `{ blob, filename, format, warnings }` result as `exportDataset`. `fromTable` options pass through unchanged.
  - `useTableExport(ref, defaults)` and `<ExportTableButton tableRef>` share the state, abort, unmount and trigger behaviour of `useExcelExport` and `<ExcelExport>`.
  - An empty ref rejects with a `TypeError` before anything is built. `FromTableOptions`, `TableElement` and `TableCellElement` are re-exported.

### Patch Changes

- 16c93eb: Thanks to the community pull requests whose ideas shaped 1.0:
  - #143 by @samuelhulla: correct the `ExcelCell` typing (#141).
  - #161 by @atefBB: document the real `alignment.horizontal` values.
  - #165 by @mehmetyilmaz001: nested object access in columns (`user.name`, #164).
  - #167 by @apperside: a callback after the file is generated.
  - #171 by @xaviergeorge: fix the `ExcelCell` value type (#141).
  - #174 by @tobwithu: make the types work with React + TypeScript.
  - #176 by @saeedkhal: skip falsy (conditional) columns.
  - #180 by @imsuvesh: ship the type declarations where npm resolves them (#179, #146, #64).
- de3f774: CSV exports started on mount under React 18/19 StrictMode no longer download twice. `toCsvBlob` is synchronous, so a CSV export (build, write, download) used to finish inside the first effect run, before StrictMode's simulated unmount could abort it. Every export (`exportDataset`, `exportWorkbook`, `exportTable`, and the hooks and components built on them) now yields once and re-checks its signal before building. xlsx exports were not affected.
