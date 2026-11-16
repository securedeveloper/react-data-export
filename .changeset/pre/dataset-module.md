---
"react-data-export": minor
---

Add the 1.0 dataset module, built on javascript-excel 2.0:
- `exportDataset(dataset, options)` and `exportWorkbook({ sheets, activeSheet }, options)` build sheets with javascript-excel's `fromDataset`/`fromDatasets`, write `.xlsx` (`toBlob`) or `.csv` (`toCsvBlob`) and download through `javascript-excel/dom`. They resolve with `{ blob, filename, format, warnings }`. Falsy sheets are skipped, `download: false` only builds the file, and `signal`/`onProgress` are supported.
- `useExcelExport(defaults)` adds `status`, `progress`, `error` and `result`, stable functions, `abort()`, and aborts running exports on unmount (StrictMode-safe).
- `<ExcelExport dataset | workbook>` renders a default button or a render prop with a `run()` that never rejects, and reports through `onExported`/`onError`.
- The entry is marked `"use client"`. The dataset, column, style and option types are javascript-excel's own, re-exported (`Dataset`, `ColumnDef`, `LeafColumn`, `GroupColumn`, `DatasetBlock`, `DatasetOptions`, `Style`, `CellInput`, `WriteOptions`, `CsvWriteOptions`, `Progress`, `ExcelWarning`, `DocProperties`), along with `isExcelError` and `sanitizeSheetName`.

The scaffold placeholder `useVersion` is removed.
