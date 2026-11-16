// Consumer TypeScript matrix: type-checks a small consumer project against the
// packed tarball (what npm users install) for each TypeScript version,
// @types/react major and moduleResolution mode.
//
//   node scripts/consumer-ts.mjs --ts 5.0,5.9,7.0 --react 18,19 --resolution node16,nodenext,bundler
//
// Every option also reads an env var (CONSUMER_TS, CONSUMER_REACT, CONSUMER_RESOLUTION).
// Without --tarball it packs packages/react-data-export, so run
// `npm run build -w react-data-export` first. Exits 1 if any cell fails.
//
// Each cell runs `tsc --noEmit` with strict and skipLibCheck: false over:
//   - a .tsx component using useExcelExport and <ExcelExport> (react-jsx), and exportDataset
//   - a CommonJS .cts consumer (node16/nodenext only; bundler has no CJS mode)
//   - @ts-expect-error probes that fail if the package's types resolve to `any`
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    ts: { type: 'string', default: process.env.CONSUMER_TS ?? '5.0,5.1,5.2,5.3,5.4,5.5,5.6,5.7,5.8,5.9,6.0,7.0' },
    react: { type: 'string', default: process.env.CONSUMER_REACT ?? '18,19' },
    resolution: { type: 'string', default: process.env.CONSUMER_RESOLUTION ?? 'node16,nodenext,bundler' },
    tarball: { type: 'string', default: process.env.CONSUMER_TARBALL },
    keep: { type: 'boolean', default: false },
  },
});
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const tsVersions = list(values.ts);
const reactMajors = list(values.react);
const resolutions = list(values.resolution);

const root = resolve(import.meta.dirname, '..');
const pkgDir = join(root, 'packages/react-data-export');
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const work = mkdtempSync(join(tmpdir(), 'rde-consumer-ts-'));
let tarball;
if (values.tarball) {
  tarball = resolve(values.tarball);
  if (!existsSync(tarball)) {
    console.error(`tarball not found: ${tarball}`);
    process.exit(1);
  }
  console.log(`using ${tarball}`);
} else {
  const [packed] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], pkgDir));
  tarball = join(work, packed.filename);
  console.log(`packed ${packed.filename}`);
}

const tsx = `import { useRef, type ReactElement } from 'react';
import { ExcelExport, ExportTableButton, exportDataset, exportTable, isExcelError, sanitizeSheetName, useExcelExport, useTableExport, version } from 'react-data-export';
import type { FromTableOptions, TableRef } from 'react-data-export';
import type { CellInput, CsvWriteOptions, Dataset, ExportResult, Style, WriteOptions } from 'react-data-export';

interface Row { name: string; n: number }
const ds: Dataset<Row> = {
  columns: [{ title: 'Name', key: 'name' }, { title: 'Double', value: (r) => r.n * 2 }, false],
  data: [{ name: 'a', n: 1 }],
};

export function Buttons(): ReactElement {
  const hook = useExcelExport({ filename: 'x' });
  return (
    <div title={version}>
      <ExcelExport dataset={{ ...ds, name: 'Rows', freezeHeader: true }} filename="rows" onExported={(r: ExportResult) => r.filename}>
        Export
      </ExcelExport>
      <ExcelExport workbook={{ sheets: [ds, null] }} format="xlsx">
        {({ run, status }) => <button onClick={() => void run()}>{status}</button>}
      </ExcelExport>
      <button onClick={() => void hook.exportDataset(ds, { format: 'csv' })}>{hook.status}</button>
    </div>
  );
}

export const done: Promise<ExportResult> = exportDataset(ds, { format: 'csv', csv: { delimiter: ';' }, download: false });

// Table export: a useRef<HTMLTableElement>(null) from any @types/react fits TableRef.
export function TablePage(): ReactElement {
  const ref = useRef<HTMLTableElement>(null);
  const hook = useTableExport(ref, { filename: 'orders', freezeHeader: true });
  const asRef: TableRef = ref;
  const fromTableOptions: FromTableOptions = { header: 'thead', styles: 'computed', autoWidth: true };
  return (
    <div>
      <table ref={ref} />
      <ExportTableButton tableRef={ref} filename="orders" autoFilter onExported={(r: ExportResult) => r.warnings}>
        Export orders
      </ExportTableButton>
      <ExportTableButton tableRef={asRef} format="csv">{({ run, status }) => <button onClick={() => void run()}>{status}</button>}</ExportTableButton>
      <button onClick={() => void hook.exportTable({ ...fromTableOptions, format: 'csv' })}>{hook.status}</button>
      <button onClick={() => void exportTable(ref, { name: 'Orders', download: false })}>direct</button>
    </div>
  );
}

// javascript-excel types, re-exported through react-data-export.
export const header: Style = { font: { bold: true }, fill: 'FFEEAA' };
export const cell: CellInput = { value: 1, style: header };
export const csv: CsvWriteOptions = { delimiter: ';', bom: true };
export const write: WriteOptions = { compression: 'store' };
export const name: string = sanitizeSheetName('Q1/Q2');
export const known: boolean = isExcelError(new Error('x'));

// These must be errors; if the package's types were missing or \`any\`, tsc reports unused directives.
// @ts-expect-error 0.x key: javascript-excel's Font has size, not sz
export const legacy: Style = { font: { sz: 12 } };
// @ts-expect-error unknown format
exportDataset(ds, { format: 'xls' });
// @ts-expect-error the value accessor gets the row type
export const wrong: Dataset<Row> = { columns: [{ title: 'x', value: (r) => r.missing }], data: [] };
// @ts-expect-error version is a string
export const notNumber: number = version;
// @ts-expect-error not a fromTable option value
export const badHeader: FromTableOptions = { header: 'tbody' };
// @ts-expect-error tableRef is required
export const noRef: ReactElement = <ExportTableButton filename="x" />;
`;
const cts = `import { exportWorkbook, sanitizeSheetName, version } from 'react-data-export';
import type { ExportResult, Style, WorkbookSpec } from 'react-data-export';

const spec: WorkbookSpec = { sheets: [{ name: 'A', columns: [{ title: 'A' }], data: [[1]] }, false] };
export const p: Promise<ExportResult> = exportWorkbook(spec, { format: 'csv', download: false });
export const s: Style = { font: { italic: true } };
export const n: string = sanitizeSheetName('a');
export const v: string = version;
// @ts-expect-error not a Style
export const bad: Style = { font: 1 };
// @ts-expect-error sheets is required
export const empty: WorkbookSpec = {};
`;

function compilerOptions(resolution) {
  const base = {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    target: 'es2022',
    lib: ['es2022', 'dom'],
    jsx: 'react-jsx',
    types: [],
  };
  if (resolution === 'bundler') return { ...base, module: 'esnext', moduleResolution: 'bundler' };
  return { ...base, module: resolution, moduleResolution: resolution };
}

const results = [];
for (const ts of tsVersions) {
  for (const react of reactMajors) {
    const dir = join(work, `ts${ts}-react${react}`);
    mkdirSync(dir, { recursive: true });
    // "type": "module" makes .tsx an ES module under node16/nodenext; .cts stays CommonJS.
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
    let installError = null;
    try {
      run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error',
        `typescript@~${ts}`, `@types/react@${react}`, `react@${react}`, tarball], dir);
    } catch (e) {
      installError = (e.stderr || e.message).trim().split('\n').slice(-3).join(' ');
    }
    const tsPkgPath = join(dir, 'node_modules/typescript/package.json');
    const tsPkg = installError ? null : JSON.parse(readFileSync(tsPkgPath, 'utf8'));
    const typesReact = installError ? null : JSON.parse(readFileSync(join(dir, 'node_modules/@types/react/package.json'), 'utf8')).version;
    // TypeScript 7 does not export ./bin/tsc, so locate the bin through package.json.
    const tsc = tsPkg && join(dirname(tsPkgPath), tsPkg.bin.tsc);

    for (const resolution of resolutions) {
      const cell = { ts, tsResolved: tsPkg?.version, react, typesReact, resolution };
      if (installError) {
        results.push({ ...cell, ok: false, detail: `install failed: ${installError}` });
        continue;
      }
      const cellDir = join(dir, resolution);
      mkdirSync(cellDir, { recursive: true });
      const files = ['app.tsx'];
      writeFileSync(join(cellDir, 'app.tsx'), tsx);
      if (resolution !== 'bundler') {
        writeFileSync(join(cellDir, 'legacy.cts'), cts);
        files.push('legacy.cts');
      }
      writeFileSync(join(cellDir, 'tsconfig.json'), JSON.stringify({ compilerOptions: compilerOptions(resolution), files }, null, 2));
      try {
        run('node', [tsc, '-p', join(cellDir, 'tsconfig.json')], cellDir);
        results.push({ ...cell, ok: true, detail: '' });
      } catch (e) {
        const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim();
        results.push({ ...cell, ok: false, detail: out.split('\n').slice(0, 6).join('\n') });
      }
    }
  }
}

const table = [
  '| TypeScript | @types/react | moduleResolution | result |',
  '|---|---|---|---|',
  ...results.map((r) => `| ${r.tsResolved ?? r.ts} | ${r.typesReact ?? r.react} | ${r.resolution} | ${r.ok ? 'pass' : 'FAIL'} |`),
].join('\n');
console.log(`\n${table}`);
// In GitHub Actions, also show the table on the run's summary page.
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table}\n`);
const failed = results.filter((r) => !r.ok);
for (const r of failed) {
  console.log(`\n--- FAIL: TS ${r.tsResolved ?? r.ts}, @types/react ${r.typesReact ?? r.react}, ${r.resolution}\n${r.detail}`);
}

if (values.keep) console.log(`\nkept ${work}`);
else rmSync(work, { recursive: true, force: true });
process.exit(failed.length ? 1 : 0);
