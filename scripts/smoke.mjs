// Packed-tarball smoke test: installs the real `npm pack` output into a throwaway
// project and checks the tarball contents, ESM import, CJS require and the types
// (under both `node16` resolution modes and `bundler`).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkgDir = join(root, 'packages/react-data-export');
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
// TypeScript 7 no longer exports `./bin/tsc`, so locate the bin via its package.json.
const tsPkgPath = createRequire(import.meta.url).resolve('typescript/package.json');
const tsc = join(dirname(tsPkgPath), JSON.parse(readFileSync(tsPkgPath, 'utf8')).bin.tsc);
const reactRange = process.env.SMOKE_REACT ?? '19';

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
const step = (msg) => console.log(`\n> ${msg}`);

const work = mkdtempSync(join(tmpdir(), 'rde-smoke-'));
try {
  step('npm pack');
  const [packed] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], pkgDir));
  const files = packed.files.map((f) => f.path).sort();
  console.log(files.join('\n'));
  const allowed = (p) => ['package.json', 'README.md', 'LICENSE'].includes(p) || p.startsWith('dist/');
  const extra = files.filter((p) => !allowed(p));
  if (extra.length) throw new Error(`unexpected files in tarball: ${extra.join(', ')}`);
  for (const need of ['package.json', 'README.md', 'LICENSE', 'dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'dist/index.d.cts', 'dist/legacy.js', 'dist/legacy.cjs', 'dist/legacy.d.ts', 'dist/legacy.d.cts']) {
    if (!files.includes(need)) throw new Error(`missing from tarball: ${need}`);
  }

  step(`install tarball + react@${reactRange} into a clean project`);
  const app = join(work, 'app');
  run('mkdir', ['-p', app]);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'smoke-app', private: true }));
  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', join(work, packed.filename), `react@${reactRange}`, `@types/react@${reactRange}`], app);

  step('"use client" directive is the first statement of every entry');
  for (const f of ['dist/index.js', 'dist/index.cjs', 'dist/legacy.js', 'dist/legacy.cjs']) {
    const first = readFileSync(join(app, 'node_modules/react-data-export', f), 'utf8').split('\n', 1)[0].trim();
    if (first !== '"use client";' && first !== "'use client';") throw new Error(`${f} starts with ${JSON.stringify(first)}, not "use client"`);
  }
  console.log('directive ok');

  step('ESM import');
  console.log(run('node', ['--input-type=module', '-e', `
    import { version, exportDataset, exportWorkbook, useExcelExport, ExcelExport, exportTable, useTableExport, ExportTableButton, isExcelError, sanitizeSheetName } from 'react-data-export';
    if (version !== ${JSON.stringify(pkg.version)}) throw new Error('bad version ' + version);
    for (const f of [exportDataset, exportWorkbook, useExcelExport, ExcelExport, exportTable, useTableExport, ExportTableButton]) if (typeof f !== 'function') throw new Error('missing export');
    const noTable = await exportTable({ current: null }).then(() => null, (e) => e);
    if (!(noTable instanceof TypeError)) throw new Error('exportTable without a table should reject with a TypeError');
    if (sanitizeSheetName('a/b') !== 'a_b' || isExcelError(new Error('x')) !== false) throw new Error('javascript-excel re-exports broken');
    const r = await exportDataset({ columns: [{ title: 'A', key: 'a' }], data: [{ a: 1 }] }, { download: false });
    if (r.filename !== 'export.xlsx' || !(r.blob.size > 0)) throw new Error('exportDataset produced no file');
    console.log('esm ok', version, r.filename, r.blob.size + ' bytes');
  `], app).trim());

  step('main entry is free of the legacy code (tree-shaken: separate entry)');
  {
    const pkgRoot = join(app, 'node_modules/react-data-export');
    // The main entry and every chunk it imports, transitively, in both formats.
    for (const entry of ['dist/index.js', 'dist/index.cjs']) {
      const seen = new Set();
      const queue = [entry];
      while (queue.length) {
        const f = queue.shift();
        if (seen.has(f)) continue;
        seen.add(f);
        const code = readFileSync(join(pkgRoot, f), 'utf8');
        if (/ExcelFile|ExcelSheet|ExcelColumn|xSteps|convertLegacyStyle/.test(code)) throw new Error(`${f} (reached from ${entry}) contains legacy code`);
        for (const m of code.matchAll(/(?:from |require\()["'](\.\/[^"']+)["']/g)) queue.push(join(dirname(f), m[1]).replace(/^\.\//, ''));
      }
      if (seen.has('dist/legacy.js') || seen.has('dist/legacy.cjs')) throw new Error(`${entry} imports the legacy entry`);
      console.log(`${entry}: ${seen.size} file(s), no legacy code`);
    }
  }

  step('legacy entry: 0.x default import (ESM) and require (CJS)');
  console.log(run('node', ['--input-type=module', '-e', `
    import ReactExport, { ExcelFile, ExcelSheet, ExcelColumn, convertLegacyStyle } from 'react-data-export/legacy';
    if (ReactExport.ExcelFile !== ExcelFile || ExcelFile.ExcelSheet !== ExcelSheet || ExcelFile.ExcelColumn !== ExcelColumn) throw new Error('0.x default export shape');
    if (convertLegacyStyle({ font: { sz: '12' } }).font.size !== 12) throw new Error('convertLegacyStyle');
    console.log('legacy esm ok');
  `], app).trim());
  console.log(run('node', ['-e', `
    const legacy = require('react-data-export/legacy');
    if (legacy.default.ExcelFile !== legacy.ExcelFile || typeof legacy.ExcelFile.ExcelSheet !== 'function') throw new Error('0.x export shape (CJS)');
    console.log('legacy cjs ok');
  `], app).trim());

  step('CJS require');
  console.log(run('node', ['-e', `
    const { version, exportDataset, exportWorkbook, useExcelExport, ExcelExport, exportTable, useTableExport, ExportTableButton, isExcelError, sanitizeSheetName } = require('react-data-export');
    if (version !== ${JSON.stringify(pkg.version)}) throw new Error('bad version ' + version);
    for (const f of [exportDataset, exportWorkbook, useExcelExport, ExcelExport, exportTable, useTableExport, ExportTableButton]) if (typeof f !== 'function') throw new Error('missing export');
    if (sanitizeSheetName('a/b') !== 'a_b' || isExcelError(new Error('x')) !== false) throw new Error('javascript-excel re-exports broken');
    exportWorkbook({ sheets: [{ columns: [{ title: 'A' }], data: [[1]] }] }, { format: 'csv', download: false }).then((r) => {
      if (r.filename !== 'export.csv' || !(r.blob.size > 0)) throw new Error('exportWorkbook produced no file');
      console.log('cjs ok', version, r.filename, r.blob.size + ' bytes');
    }).catch((e) => { console.error(e); process.exit(1); });
  `], app).trim());

  step('types (node16 ESM + CJS, bundler)');
  const src = `import { version, exportDataset, type ExportResult } from 'react-data-export';\nconst v: string = version;\nconst p: Promise<ExportResult> = exportDataset({ data: [{ a: 1 }] }, { download: false });\nexport { v, p };\n`;
  writeFileSync(join(app, 'esm.mts'), src);
  writeFileSync(join(app, 'cjs.cts'), src);
  writeFileSync(join(app, 'bundler.ts'), src);
  const common = ['--noEmit', '--strict', '--target', 'es2022', '--skipLibCheck', 'false', '--types', 'react'];
  run('node', [tsc, ...common, '--module', 'node16', '--moduleResolution', 'node16', 'esm.mts', 'cjs.cts'], app);
  run('node', [tsc, ...common, '--module', 'esnext', '--moduleResolution', 'bundler', 'bundler.ts'], app);
  console.log('types ok');

  console.log('\nsmoke test passed');
} finally {
  rmSync(work, { recursive: true, force: true });
}
