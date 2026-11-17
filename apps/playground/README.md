# react-data-export playground (dev sandbox)

> **Dev sandbox, not deployed.** This app runs in CI (tests and build) and locally. It is not deployed anywhere. The public playground is a separate repository, [`securedeveloper/react-data-export-playground`](https://github.com/securedeveloper/react-data-export-playground), live at https://react-data-export-playground.vercel.app/. It installs the published package from npm.

A Vite + React 19 app that runs the real library in the browser. It is private and never published to npm.

- **Dataset**: edit a dataset as JSON (`{ columns, data }`), pick export options (sheet name, file name, `.xlsx` or `.csv`, header fill, frozen header, autofilter, auto width, totals row, banded rows), and see the generated sheet in a live preview. The preview runs the same `fromDataset` call the export uses: grouped headers show as merged cells, and hovering a cell shows its number format or formula. Download it two ways:
  - **`<ExcelExport>`** with a render prop, the ready-made component;
  - **`useExcelExport`**, the hook, with its status, progress, the saved file's size, and a Cancel button while it runs.
- **Table**: a rendered HTML `<table>` (a two-row header with `rowspan`/`colspan`, typed `data-type`/`data-numfmt` cells, a link, a `data-export-ignore` row, a `hidden` row, a footer; `src/demo-table.tsx`) exported with `<ExportTableButton tableRef={ref}>` and with `useTableExport(ref)` behind a custom button. A format choice and a computed-styles toggle, and a preview of the sheet `fromTable` builds from it.

The app imports the workspace package from its TypeScript sources (`vite.config.ts`), so it always matches the branch. Nothing leaves the browser: there are no uploads, analytics, cookies, CDNs or external requests. `vite.config.ts` gives `vite preview` a strict Content-Security-Policy (`'self'` only) and the other security headers, so the CSP gets tested locally.

## Commands (from the repo root)

```sh
npm ci
npm run dev -w playground        # http://localhost:5173
npm test -w playground           # option mapping and preview grid (Vitest)
npm run build -w playground      # → apps/playground/dist
npm run preview -w playground    # serves dist with the security headers
```
