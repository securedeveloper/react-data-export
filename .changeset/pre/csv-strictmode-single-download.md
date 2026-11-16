---
"react-data-export": patch
---

CSV exports started on mount under React 18/19 StrictMode no longer download twice. `toCsvBlob` is synchronous, so a CSV export (build, write, download) used to finish inside the first effect run, before StrictMode's simulated unmount could abort it. Every export (`exportDataset`, `exportWorkbook`, `exportTable`, and the hooks and components built on them) now yields once and re-checks its signal before building. xlsx exports were not affected.
