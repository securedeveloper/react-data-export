---
"react-data-export": minor
---

Add `react-data-export/legacy`, a deprecated quick path for 0.x code: `<ExcelFile>`, `<ExcelSheet>`, `<ExcelColumn>`, the 0.x default export (`import ReactExport from 'react-data-export/legacy'`), the `dataSet` shape with `xSteps`/`ySteps`, and xlsx-style cell styles, built on 1.0's export code and javascript-excel. The files it writes match 0.6.0's (checked against the real 0.6.0):
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
