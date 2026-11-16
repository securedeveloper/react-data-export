# react-data-export playground

A Vite + React 19 app that runs the real library in the browser. It is private and never published to npm.

- **Dataset**: edit a dataset as JSON (`{ columns, data }`), pick export options (sheet name, file name, `.xlsx` or `.csv`, header fill, frozen header, autofilter, auto width, totals row, banded rows), and see the generated sheet in a live preview. The preview runs the same `fromDataset` call the export uses: grouped headers show as merged cells, and hovering a cell shows its number format or formula. Download it two ways:
  - **`<ExcelExport>`** with a render prop, the ready-made component;
  - **`useExcelExport`**, the hook, with its status, progress, the saved file's size, and a Cancel button while it runs.
- **Table**: a rendered HTML `<table>` (a two-row header with `rowspan`/`colspan`, typed `data-type`/`data-numfmt` cells, a link, a `data-export-ignore` row, a footer) exported with `<ExportTableButton tableRef={ref}>` and with `useTableExport(ref)` behind a custom button. A format choice and a computed-styles toggle, and a preview of the sheet `fromTable` builds from it.

The app imports the workspace package from its TypeScript sources (`vite.config.ts`), so it always matches the branch. Nothing leaves the browser: there are no uploads, analytics, cookies, CDNs or external requests. `vercel.json` sets a strict Content-Security-Policy (`'self'` only), and `vite preview` serves the same headers, so the CSP is exercised locally.

## Commands (from the repo root)

```sh
npm ci
npm run dev -w playground        # http://localhost:5173
npm test -w playground           # option mapping and preview grid (Vitest)
npm run build -w playground      # → apps/playground/dist
npm run preview -w playground    # serves dist with the production headers
```

## Deploying on Vercel (for Afzal; the project is not created yet)

Create a project from `securedeveloper/react-data-export` with:

| Setting | Value |
|---|---|
| Project name | `react-data-export-playground` (gives `react-data-export-playground.vercel.app`) |
| Root Directory | `apps/playground` |
| Framework preset | Vite (also set in `vercel.json`) |
| Install command | `cd ../.. && npm ci` (from `vercel.json`: installs the whole workspace) |
| Build command | `npm run build` (from `vercel.json`) |
| Output directory | `dist` (from `vercel.json`) |
| Node.js version | 24.x (the workspace needs Node ^22.22.2, ^24.15.0 or ≥ 26) |
| Production branch | `main` |

- "Include files outside the root directory in the Build Step" must stay enabled (Vercel's default), because the app builds the library from `../../packages/react-data-export/src`.
- No environment variables are needed.
- The security headers come from `vercel.json`. After the first deploy, check them with `curl -sI https://react-data-export-playground.vercel.app/ | grep -i content-security`.
