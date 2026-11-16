import { useId, useMemo, useState, type ReactElement } from "react";
import { fromDataset, type Sheet } from "javascript-excel";
import { ExcelExport, isExcelError, useExcelExport, version, type ExcelWarning } from "react-data-export";
import { DEFAULT_OPTIONS, exportOptions, parseDataset, sheetOptions, type EditorOptions } from "./options";
import { previewOf, type Preview } from "./preview";
import { SAMPLE_DATASET } from "./sample";

const TABS = [
  { id: "dataset", label: "Dataset" },
  { id: "table", label: "Table" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function describe(error: unknown): string {
  if (isExcelError(error)) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}

/** 0 -> "A", 25 -> "Z", 26 -> "AA". */
function columnName(c: number): string {
  let s = "";
  for (let n = c + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function PreviewTable({ preview }: { preview: Preview }): ReactElement {
  return (
    <div className="sheet-scroll" role="region" aria-label="Sheet preview" tabIndex={0}>
      <table className="sheet">
        <caption>Preview of the generated sheet{preview.truncated ? " (first 200 rows)" : ""}. Values are shown unformatted; hover a cell for its number format or formula.</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Row</span>
            </th>
            {Array.from({ length: preview.columns }, (_, c) => (
              <th key={c} scope="col">
                {columnName(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row, r) => (
            <tr key={r} className={r < preview.frozenRows ? "frozen" : undefined}>
              <th scope="row">{r + 1}</th>
              {row.map((cell, c) =>
                cell === null ? null : (
                  <td
                    key={c}
                    colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                    rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                    title={cell.title}
                    style={{ fontWeight: cell.bold ? 700 : undefined, background: cell.background, color: cell.background ? "#1a1a1a" : undefined, textAlign: cell.align }}
                  >
                    {cell.text}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }): ReactElement {
  const id = useId();
  return (
    <div className="check">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

function DatasetTab(): ReactElement {
  const [text, setText] = useState(() => JSON.stringify(SAMPLE_DATASET, null, 2));
  const [o, setO] = useState<EditorOptions>(DEFAULT_OPTIONS);
  const set = <K extends keyof EditorOptions>(k: K) => (v: EditorOptions[K]) => setO((prev) => ({ ...prev, [k]: v }));
  const hook = useExcelExport();
  const ids = { text: useId(), help: useId(), name: useId(), file: useId(), format: useId(), fill: useId() };

  // The preview runs the same fromDataset call the export uses.
  const built = useMemo((): { sheet?: Sheet; warnings: ExcelWarning[]; error?: string } => {
    const parsed = parseDataset(text);
    if (!parsed.ok) return { warnings: [], error: parsed.message };
    const warnings: ExcelWarning[] = [];
    try {
      const sheet = fromDataset(parsed.dataset, { ...sheetOptions(o), onWarning: (w) => warnings.push(w) });
      return { sheet, warnings };
    } catch (e) {
      return { warnings, error: describe(e) };
    }
  }, [text, o]);
  const parsed = parseDataset(text);
  const dataset = parsed.ok ? { ...parsed.dataset, ...sheetOptions(o) } : undefined;

  return (
    <div className="dataset-tab">
      <div className="editor">
        <label htmlFor={ids.text}>Dataset (JSON)</label>
        <textarea id={ids.text} aria-describedby={ids.help} rows={20} spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
        <p id={ids.help} className="hint">
          <code>{"{ columns, data }"}</code>. Columns take <code>key</code>, <code>path</code>, <code>title</code>, <code>type</code>, <code>numFmt</code>, <code>width</code>, <code>total</code> and <code>children</code> (grouped headers). Edits update the preview live.
        </p>
      </div>
      <fieldset className="options">
        <legend>Export options</legend>
        <div className="field">
          <label htmlFor={ids.name}>Sheet name</label>
          <input id={ids.name} value={o.sheetName} onChange={(e) => set("sheetName")(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={ids.file}>File name</label>
          <input id={ids.file} value={o.filename} onChange={(e) => set("filename")(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={ids.format}>Format</label>
          <select id={ids.format} value={o.format} onChange={(e) => set("format")(e.target.value as EditorOptions["format"])}>
            <option value="xlsx">.xlsx</option>
            <option value="csv">.csv</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={ids.fill}>Header fill</label>
          <select id={ids.fill} value={o.headerFill} onChange={(e) => set("headerFill")(e.target.value as EditorOptions["headerFill"])}>
            <option value="">None</option>
            <option value="DDEBF7">Light blue</option>
            <option value="E2EFDA">Light green</option>
            <option value="FCE4D6">Light orange</option>
          </select>
        </div>
        <Check label="Freeze header rows" checked={o.freezeHeader} onChange={set("freezeHeader")} />
        <Check label="Autofilter" checked={o.autoFilter} onChange={set("autoFilter")} />
        <Check label="Auto column width" checked={o.autoWidth} onChange={set("autoWidth")} />
        <Check label="Totals row" checked={o.totals} onChange={set("totals")} />
        <Check label="Banded rows" checked={o.bandedRows} onChange={set("bandedRows")} />
      </fieldset>

      <div className="actions">
        {/* The component: a ready-made button, disabled while it exports. */}
        <ExcelExport dataset={dataset} {...exportOptions(o)} onError={() => undefined}>
          {({ run, status }) => (
            <button type="button" disabled={!dataset || status === "exporting"} onClick={() => void run()}>
              Download with &lt;ExcelExport&gt;
            </button>
          )}
        </ExcelExport>
        {/* The hook: the same export, with status, progress and abort in your own UI. */}
        <button type="button" disabled={!parsed.ok || hook.status === "exporting"} onClick={() => parsed.ok && void hook.exportDataset(parsed.dataset, { ...sheetOptions(o), ...exportOptions(o) }).catch(() => undefined)}>
          Download with useExcelExport
        </button>
        {hook.status === "exporting" ? (
          <button type="button" onClick={() => hook.abort()}>
            Cancel
          </button>
        ) : null}
      </div>
      <p className="status" role="status">
        {built.error
          ? ""
          : hook.status === "exporting"
            ? `Exporting… ${Math.round((hook.progress?.ratio ?? 0) * 100)}%`
            : hook.status === "done" && hook.result
              ? `Saved ${hook.result.filename} (${hook.result.blob.size.toLocaleString("en-US")} bytes).`
              : hook.status === "error"
                ? `Export failed: ${describe(hook.error)}`
                : `Ready: ${built.sheet?.rows.length ?? 0} rows.`}
      </p>
      {built.error ? (
        <p className="status error" role="alert">
          {built.error}
        </p>
      ) : null}
      {built.sheet ? <PreviewTable preview={previewOf(built.sheet)} /> : null}
      {built.warnings.length ? (
        <>
          <h2>Warnings</h2>
          <ul>
            {built.warnings.map((w, i) => (
              <li key={i}>
                <code>{w.code}</code> {w.message}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function TableTab(): ReactElement {
  return (
    <div>
      <p>
        Exporting an HTML <code>&lt;table&gt;</code> (<code>exportTable</code>, <code>useTableExport</code>, <code>&lt;ExportTableButton&gt;</code>) comes with the table module, which is still in progress. This tab will show it once it is released.
      </p>
    </div>
  );
}

export function App(): ReactElement {
  const fromHash = (): TabId => (TABS.find((t) => `#${t.id}` === location.hash)?.id ?? "dataset");
  const [tab, setTab] = useState<TabId>(fromHash);
  const select = (id: TabId, focus: boolean): void => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
    if (focus) document.getElementById(`tab-${id}`)?.focus();
  };
  return (
    <>
      <aside className="banner" aria-label="Prerelease notice">
        <strong>Prerelease.</strong> react-data-export {version} is an alpha; the API can still change before 1.0.0. Everything runs in your browser: no uploads, no tracking, no cookies.
      </aside>
      <main>
        <header>
          <h1>react-data-export playground</h1>
          <p className="lead">Edit a dataset, pick export options, see the sheet, and download it as .xlsx or .csv with the real library.</p>
        </header>
        <div className="tablist" role="tablist" aria-label="Playground sections">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => select(t.id, false)}
              onKeyDown={(e) => {
                const n = TABS.length;
                const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
                if (next >= 0) {
                  e.preventDefault();
                  select(TABS[next]!.id, true);
                }
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {TABS.map((t) => (
          <section key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} tabIndex={0} hidden={tab !== t.id} className="panel">
            {t.id === "dataset" ? <DatasetTab /> : <TableTab />}
          </section>
        ))}
      </main>
      <footer>
        <p>
          <a href="https://github.com/securedeveloper/react-data-export">Source on GitHub</a> · built on{" "}
          <a href="https://github.com/securedeveloper/javascript-excel">javascript-excel</a> · MIT licence
        </p>
      </footer>
    </>
  );
}
