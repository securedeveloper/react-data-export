# Conformance: javascript-excel’s corpus through the React API

<!-- Generated from packages/react-data-export/test/conformance/expressible.ts by `npm run conformance:doc`. Do not edit by hand. -->

javascript-excel keeps a conformance corpus: one workbook per feature area, plus a kitchen sink, each checked in LibreOffice, openpyxl and javascript-excel’s own reader. `packages/react-data-export/test/conformance` runs the same workbooks through react-data-export’s public API (`exportWorkbook`, `exportDataset`, the hooks and the components) and compares the result with the file javascript-excel writes for the same workbook.

## How it is checked

- **The corpus** is copied from javascript-excel’s git tag for the installed version (`npm run conformance:sync`; CI fails when the copy is out of date).
- **Each workbook** becomes `exportWorkbook` input: a sheet frozen below a row of titles is a dataset with that row as its header and `freezeHeader`; any other sheet is headerless blocks of array rows (`header: false`, columns picked by `index`). Column widths, hidden columns, right-to-left, the active sheet, document properties and write options carry over.
- **Byte-identical** to javascript-excel’s file when the API can express every feature of the file.
- **Otherwise** the features it cannot express are exactly the ones listed for the file below, and the file is byte-identical to javascript-excel’s file for the same workbook without them. (A column style stays on the column’s cells, as javascript-excel’s writer applies it to them.)
- **Read back** with `javascript-excel/read`: no warnings, and the same sheets, values, merges and defined names as that workbook.
- **openpyxl** opens it and sees the same sheets and cell values as in javascript-excel’s file of the full corpus workbook (except where the 1904 date system or a merge changes them). This runs in CI’s Conformance job.
- **exportDataset** writes the same bytes as `exportWorkbook` for every single-sheet file, and `format: 'csv'` writes what javascript-excel’s `toCsvBlob` writes.
- **The builders file** (`19-builders`) is built with `fromDataset`/`fromDatasets`; its Dataset and Stacked sheets are also built from the same dataset input through `exportWorkbook`, `useExcelExport` and `<ExcelExport>`, byte-identical to javascript-excel’s file.
- **Table export:** javascript-excel’s table golden case (`fromTable`) through `exportTable`, `useTableExport` and `<ExportTableButton>` is byte-identical to `fromTable` + `toUint8Array`.

## Files

| File | Covers | Through the React API |
|---|---|---|
| `01-values.xlsx` | Cell values | byte-identical without `colProps.style`. |
| `02-text.xlsx` | Text edge cases and rich text | byte-identical without `colProps.style`. |
| `03-dates.xlsx` | Dates (1900 date system) | byte-identical without `colProps.style`. |
| `04-dates-1904.xlsx` | Dates (1904 date system) | byte-identical without `colProps.style`, `date1904`. |
| `05-formulas.xlsx` | Formulas and cached values | byte-identical. |
| `06-fonts.xlsx` | Fonts | byte-identical without `colProps.style`. |
| `07-fills.xlsx` | Fills | byte-identical without `colProps.style`. |
| `08-borders.xlsx` | Borders | byte-identical without `colProps.style`. |
| `09-alignment.xlsx` | Alignment and protection | byte-identical without `colProps.style`, `rowProps.height`. |
| `10-number-formats.xlsx` | Built-in and custom number formats | byte-identical without `colProps.style`. |
| `11-number-formats-locale.xlsx` | Locale-dependent built-in number formats | byte-identical. |
| `12-colours.xlsx` | Colours: theme order, tints, indexed palette | byte-identical. |
| `13-columns-rows.xlsx` | Column widths, row heights, hidden and outline | byte-identical without `colProps.outlineLevel`, `colProps.style`, `colProps.width: 'auto' (bestFit)`, `defaultRowHeight`, `rowProps.height`, `rowProps.hidden`, `rowProps.outlineLevel`, `rowProps.style`. |
| `14-merges-views.xlsx` | Merges, freeze panes, views and tab colours | byte-identical without `merges`, `state`, `tabColor`, `view.activeCell`, `view.freeze`, `view.showGridLines`, `view.showRowColHeaders`, `view.zoom`. |
| `15-hyperlinks-names.xlsx` | Hyperlinks and defined names | byte-identical without `colProps.style`, `definedNames`. |
| `16-print.xlsx` | Print setup | byte-identical without `print`. |
| `17-workbook.xlsx` | Workbook properties, default font and sheet names | byte-identical without `defaultFont`, `print`. |
| `18-limits.xlsx` | Format limits | byte-identical. |
| `19-builders.xlsx` | Dataset builders (fromDataset, fromDatasets) | byte-identical without `autoFilter`, `colProps.style`, `merges`, `view.freeze`. Its Dataset and Stacked sheets are made by `fromDataset`/`fromDatasets`; built from that same dataset input, they are byte-identical (see above). Converting the finished sheet cannot recover the header groups, hence the list. |
| `99-kitchen-sink.xlsx` | Kitchen sink | byte-identical without `autoFilter`, `colProps.outlineLevel`, `colProps.style`, `colProps.width: 'auto' (bestFit)`, `defaultRowHeight`, `definedNames`, `merges`, `print`, `rowProps.height`, `rowProps.hidden`, `rowProps.outlineLevel`, `rowProps.style`, `state`, `tabColor`, `view.activeCell`, `view.freeze`, `view.showGridLines`, `view.showRowColHeaders`, `view.zoom`. |

## Not expressible through the React API

react-data-export builds every sheet with javascript-excel’s dataset builders, so a sheet is what a dataset and its options describe. These features of the corpus are outside that. A file that needs them is written with javascript-excel directly (`toBlob`, then `download` from `javascript-excel/dom`).

| Feature | Why |
|---|---|
| `autoFilter` | An autofilter on a range other than the header and data rows: `autoFilter: true` always covers exactly those. |
| `colProps.width: 'auto' (bestFit)` | `width: 'auto'` is measured by `fromDataset`, which writes the measured width. javascript-excel’s writer, given `'auto'`, writes the same width and also marks the column best-fit. |
| `colProps.outlineLevel` | Column outline levels (grouped columns). |
| `colProps.style` | Column styles. The column’s cells get the style (the dataset column’s `style` and `headerStyle`), but the column itself, and so its empty cells, does not. |
| `date1904` | The 1904 date system: a workbook setting that neither `WorkbookSpec` nor `ExportOptions` carries. |
| `defaultFont` | The workbook’s default font. |
| `defaultRowHeight` | A sheet’s default row height. |
| `definedNames` | Defined names (workbook and sheet scope). |
| `merges` | Merged cells other than the header-group merges `fromDataset` makes. |
| `print` | Print setup (orientation, paper, margins, print area and titles, headers and footers). |
| `rowProps.height` | Row heights: a dataset has no row properties. |
| `rowProps.hidden` | Hidden rows. |
| `rowProps.outlineLevel` | Row outline levels (grouped rows). |
| `rowProps.style` | Row styles. `rowStyle` styles the cells of a data row, empty ones included, which is not the same file. |
| `state` | Hidden and very hidden sheets. |
| `tabColor` | Sheet tab colours. |
| `view.activeCell` | The active cell of a sheet view. |
| `view.freeze` | Frozen columns, or frozen rows other than the header rows (`freezeHeader`). |
| `view.showGridLines` | Hiding gridlines. |
| `view.showRowColHeaders` | Hiding row and column headings. |
| `view.zoom` | Sheet zoom. |
