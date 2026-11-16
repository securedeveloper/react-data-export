# Bundler fixtures

Small apps that install the **packed** react-data-export tarball, exactly as users get it from npm, and build with a real bundler and no `fs`, `Buffer` or other Node polyfill configuration. `scripts/bundlers.mjs` copies each one to a temporary folder, installs it, builds it and checks the result. The non-required CI job `Bundlers` runs it.

| fixture | bundler | React | checks |
|---|---|---|---|
| `vite-react19` | Vite 8 | 19 | production build of `<ExcelExport>`, `useExcelExport`, `exportDataset` and `useTableExport(ref)` behind a custom button; the bundle has no `fs`/`tempa-xlsx`/`jszip`/`cptable` |
| `next-app` | Next.js 16 (App Router, webpack and Turbopack builds) | 19 | `next build`: a server component renders `<ExcelExport>` (a client component through `"use client"`) and client components use the hook and `<ExportTableButton tableRef={ref}>` on a table with a `colspan` header; the page is prerendered on the server (the check looks for the table and the button in the HTML), so importing the package on the server must not crash |
| `webpack5-cra` | Create React App 5 (`react-scripts`, webpack 5) | 18 | production build with CRA's default config, which has no Node polyfills, including `<ExportTableButton>` (the `javascript-excel/dom` subpath through webpack 5's exports-map resolution) |
| `react17-ts` | Vite 8 | 17, with `@types/react` 17 | `tsc` against the published types, including `exportTable(ref, { format: "csv" })` with React 17's `useRef<HTMLTableElement>(null)`, then a production build |

These replace the failures reported in #168 (`Can't resolve 'fs'` with react-scripts 5), #173 (`cptable is not defined` with Vite), #177 (`Could not resolve "xlsx"` with Vite) and #182 (`jszip is not a constructor`). All of them came from the 0.x dependency on `tempa-xlsx`, `jszip` and `file-saver`, which 1.0 no longer has.

```sh
npm run bundlers                 # all fixtures
npm run bundlers -- next-app     # one
```
