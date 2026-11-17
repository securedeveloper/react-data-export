// Bundler matrix: builds each app in fixtures/ against the packed react-data-export
// tarball, with no Node polyfill configuration, and checks the output.
//
//   npm run bundlers                  # every fixture
//   npm run bundlers -- next-app      # one or more by name
//
// Each fixture is copied to a temporary folder (so nothing is installed into
// the repository), gets "react-data-export": "file:<tarball>" added, and is
// installed from the registry with its own pinned dependencies.
import { execFileSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const pkgDir = join(root, 'packages/react-data-export');
const fixturesDir = join(root, 'fixtures');
const only = process.argv.slice(2);

const run = (cmd, args, cwd, env = {}) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env }, maxBuffer: 1 << 28 });
const step = (msg) => console.log(`\n> ${msg}`);

/** Every file under `dir` whose name matches `ext`. */
function filesIn(dir, ext) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...filesIn(p, ext));
    else if (ext.test(name)) out.push(p);
  }
  return out;
}

// What the 0.x builds dragged into browser bundles (#168, #173, #177, #182).
const FORBIDDEN = [
  { what: 'a Node "fs" import', re: /require\(\s*["'](?:node:)?fs["']\s*\)|from\s*["'](?:node:)?fs["']/ },
  { what: 'tempa-xlsx', re: /tempa-xlsx/ },
  { what: 'jszip', re: /jszip|JSZip/ },
  { what: 'cptable', re: /\bcptable\b/ },
  { what: 'file-saver', re: /file-saver|FileSaver/ },
];

function scanClientBundle(dir) {
  const js = filesIn(dir, /\.(c|m)?js$/);
  if (js.length === 0) throw new Error(`no JavaScript output in ${dir}`);
  const found = [];
  for (const file of js) {
    const text = readFileSync(file, 'utf8');
    for (const f of FORBIDDEN) if (f.re.test(text)) found.push(`${f.what} in ${file.slice(dir.length + 1)}`);
  }
  if (found.length) throw new Error(`client bundle contains ${found.join('; ')}`);
  const bytes = js.reduce((n, f) => n + statSync(f).size, 0);
  return `${js.length} JS files, ${(bytes / 1024).toFixed(0)} KiB`;
}

const kib = (n) => `${(n / 1024).toFixed(1)} KiB`;

/** Size of the JavaScript an app ships: minified, gzip -9 and brotli -11, summed over its files. */
function jsSize(dir) {
  const size = { min: 0, gzip: 0, brotli: 0 };
  for (const file of filesIn(dir, /\.js$/)) {
    const buf = readFileSync(file);
    size.min += buf.length;
    size.gzip += gzipSync(buf, { level: 9 }).length;
    size.brotli += brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
  }
  return size;
}

// fixtures/bundle-size: what react-data-export adds to a Vite + React 19
// production build, per usage, against the same app without it (#110).
const SIZE_ENTRIES = [
  ['dataset', '1.0: `exportDataset` behind a button'],
  ['table', '1.0: `<ExportTableButton>` on a table'],
  ['all', '1.0: every export of the main entry'],
  ['v0.6', '0.6.0: `<ExcelFile>` + `<ExcelSheet>` + `<ExcelColumn>`'],
];
const sizeTables = [];

const CHECKS = {
  'bundle-size': (app) => {
    const build = (entry) => {
      run('npm', ['run', 'build'], app, { ENTRY: entry });
      return jsSize(join(app, 'dist', entry));
    };
    const version = (name) => JSON.parse(readFileSync(join(app, 'node_modules', name, 'package.json'), 'utf8')).version;
    const base = build('baseline');
    const rows = SIZE_ENTRIES.map(([entry, what]) => {
      const s = build(entry);
      // 1.0 builds get the same no-fs/tempa-xlsx/jszip scan as the other fixtures; 0.6.0 has them all.
      if (entry !== 'v0.6') scanClientBundle(join(app, 'dist', entry));
      return `| ${what} | +${kib(s.min - base.min)} | +${kib(s.gzip - base.gzip)} | +${kib(s.brotli - base.brotli)} |`;
    });
    sizeTables.push(
      [
        `Added to a Vite ${version('vite')} + React ${version('react')} production build by react-data-export ${version('react-data-export')} on javascript-excel ${version('javascript-excel')} (baseline, React alone: ${kib(base.min)} minified, ${kib(base.gzip)} gzip):`,
        '',
        '| app | minified | gzip -9 | brotli -11 |',
        '|---|---|---|---|',
        ...rows,
      ].join('\n'),
    );
    return `baseline ${kib(base.gzip)} gzip; see the size table`;
  },
  'vite-react19': (app) => {
    run('npm', ['run', 'build'], app);
    return scanClientBundle(join(app, 'dist'));
  },
  'react17-ts': (app) => {
    run('npm', ['run', 'build'], app); // tsc against the published types, then vite build
    return `tsc ok; ${scanClientBundle(join(app, 'dist'))}`;
  },
  'webpack5-cra': (app) => {
    run('npm', ['run', 'build'], app, { CI: 'true', GENERATE_SOURCEMAP: 'false' }); // CI=true: warnings fail the build
    return scanClientBundle(join(app, 'build/static/js'));
  },
  'next-app': (app) => {
    const notes = [];
    for (const script of ['build', 'build:turbopack']) {
      rmSync(join(app, '.next'), { recursive: true, force: true });
      run('npm', ['run', script], app, { NEXT_TELEMETRY_DISABLED: '1' });
      // The page was prerendered on the server: the package was imported there and rendered.
      const html = filesIn(join(app, '.next/server/app'), /^index\.html$/)[0];
      if (!html) throw new Error(`${script}: no prerendered index.html`);
      const page = readFileSync(html, 'utf8');
      if (!page.includes('Server-rendered page') || !page.includes('Export')) throw new Error(`${script}: prerendered page is missing the export button`);
      // The table client component rendered on the server too: its colspan header and its <ExportTableButton>.
      if (!page.includes('colSpan="2"') && !page.includes('colspan="2"')) throw new Error(`${script}: prerendered page is missing the table`);
      if (!page.includes('Export table')) throw new Error(`${script}: prerendered page is missing <ExportTableButton>`);
      notes.push(`${script === 'build' ? 'webpack' : 'turbopack'}: prerendered, ${scanClientBundle(join(app, '.next/static'))}`);
    }
    return notes.join('; ');
  },
};

const work = mkdtempSync(join(tmpdir(), 'rde-bundlers-'));
const results = [];
try {
  step('build and pack react-data-export');
  run('npm', ['run', 'build', '-w', 'react-data-export'], root);
  const [packed] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], pkgDir));
  const tarball = join(work, packed.filename);
  console.log(packed.filename);

  const names = readdirSync(fixturesDir).filter((n) => existsSync(join(fixturesDir, n, 'package.json')) && (only.length === 0 || only.includes(n)));
  for (const n of only) if (!names.includes(n)) throw new Error(`no fixture named ${n}`);
  for (const name of names) {
    step(name);
    const app = join(work, name);
    cpSync(join(fixturesDir, name), app, { recursive: true });
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
    pkg.dependencies = { ...pkg.dependencies, 'react-data-export': `file:${tarball}` };
    writeFileSync(join(app, 'package.json'), JSON.stringify(pkg, null, 2));
    const t0 = Date.now();
    try {
      run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], app);
      const note = CHECKS[name] ? CHECKS[name](app) : (run('npm', ['run', 'build'], app), 'built');
      const secs = ((Date.now() - t0) / 1000).toFixed(0);
      results.push({ name, ok: true, note: `${note} (${secs} s)` });
      console.log(`ok ${name}: ${note}`);
    } catch (err) {
      const out = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim().split('\n').slice(-30).join('\n');
      results.push({ name, ok: false, note: String(err.message).split('\n')[0] });
      console.error(`FAIL ${name}: ${err.message}\n${out}`);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

const table = ['| fixture | result | notes |', '|---|---|---|', ...results.map((r) => `| ${r.name} | ${r.ok ? 'pass' : '**fail**'} | ${r.note} |`)].join('\n');
console.log(`\n${table}`);
for (const t of sizeTables) console.log(`\n${t}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Bundlers\n\n${table}\n`);
  for (const t of sizeTables) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n### Bundle size\n\n${t}\n`);
}
if (results.some((r) => !r.ok)) process.exit(1);
