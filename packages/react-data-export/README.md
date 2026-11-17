# react-data-export

Export data from React to `.xlsx` and `.csv`, built on [javascript-excel](https://github.com/securedeveloper/javascript-excel) 2.0.

> **This is a 1.0 prerelease of a from-scratch rewrite** (`npm install react-data-export@next`). The API may still change before 1.0.0. 1.0's main API is new: the main entry has no `<ExcelFile>` / `<ExcelSheet>` / `<ExcelColumn>`, and the 0.6 API ships only as the deprecated `react-data-export/legacy` entry (removed in 2.0). The [migration guide](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md) shows every 0.x pattern next to its 1.0 code. The `latest` tag stays **0.6.0** until 1.0.0 is final; the 0.x docs are at the [`v0.6.0` tag](https://github.com/securedeveloper/react-data-export/tree/v0.6.0).

```tsx
import { useRef } from 'react';
import { ExcelExport, ExportTableButton } from 'react-data-export';

// A dataset: { columns, data } (javascript-excel's shape)
<ExcelExport dataset={{ columns: [{ title: 'Name', key: 'name' }], data: [{ name: 'Ada' }], freezeHeader: true }} filename="people">
  Download people.xlsx
</ExcelExport>;

// An HTML table on the page: colspan/rowspan become merged cells
function Orders() {
  const ref = useRef<HTMLTableElement>(null);
  return (
    <>
      <table ref={ref}>{/* … */}</table>
      <ExportTableButton tableRef={ref} filename="orders" format="csv" />
    </>
  );
}
```

There are also plain async functions (`exportDataset`, `exportWorkbook`, `exportTable`) and hooks (`useExcelExport`, `useTableExport`). Every export resolves with `{ blob, filename, format, warnings }`. The full API is in [docs/api.md](https://github.com/securedeveloper/react-data-export/blob/main/docs/api.md).

Moving from 0.x in steps? `react-data-export/legacy` keeps `<ExcelFile>`, `<ExcelSheet>` and `<ExcelColumn>` working on 1.0 (deprecated, removed in 2.0); see the [quick path](https://github.com/securedeveloper/react-data-export/blob/main/docs/migration.md#11-quick-path-react-data-exportlegacy).

Try it in the [playground](https://react-data-export-playground.vercel.app/).

React 17, 18 and 19; TypeScript 5.0+. MIT licensed.
