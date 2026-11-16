---
"react-data-export": minor
---

Add table export, built on javascript-excel 2.0's `fromTable`:
- `exportTable(tableOrRef, options)` reads an HTML `<table>` (an element, or a ref read when called). `colspan`/`rowspan` become merges, `<thead>` rows become headers, hidden and `[data-export-ignore]` rows are skipped, and `data-*` hints are honoured. It exports `.xlsx` or `.csv` with the same options and the same `{ blob, filename, format, warnings }` result as `exportDataset`. `fromTable` options pass through unchanged.
- `useTableExport(ref, defaults)` and `<ExportTableButton tableRef>` share the state, abort, unmount and trigger behaviour of `useExcelExport` and `<ExcelExport>`.
- An empty ref rejects with a `TypeError` before anything is built. `FromTableOptions`, `TableElement` and `TableCellElement` are re-exported.
