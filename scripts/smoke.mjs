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
  for (const need of ['package.json', 'README.md', 'LICENSE', 'dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'dist/index.d.cts']) {
    if (!files.includes(need)) throw new Error(`missing from tarball: ${need}`);
  }

  step(`install tarball + react@${reactRange} into a clean project`);
  const app = join(work, 'app');
  run('mkdir', ['-p', app]);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'smoke-app', private: true }));
  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', join(work, packed.filename), `react@${reactRange}`, `@types/react@${reactRange}`], app);

  step('"use client" directive is the first statement of both builds');
  for (const f of ['dist/index.js', 'dist/index.cjs']) {
    const first = readFileSync(join(app, 'node_modules/react-data-export', f), 'utf8').split('\n', 1)[0].trim();
    if (first !== '"use client";' && first !== "'use client';") throw new Error(`${f} starts with ${JSON.stringify(first)}, not "use client"`);
  }
  console.log('directive ok');

  step('ESM import');
  console.log(run('node', ['--input-type=module', '-e', `
    import { version, useVersion } from 'react-data-export';
    if (version !== ${JSON.stringify(pkg.version)}) throw new Error('bad version ' + version);
    if (typeof useVersion !== 'function') throw new Error('useVersion missing');
    const { isExcelError, sanitizeSheetName } = await import('react-data-export');
    if (sanitizeSheetName('a/b') !== 'a_b' || isExcelError(new Error('x')) !== false) throw new Error('javascript-excel re-exports broken');
    console.log('esm ok', version);
  `], app).trim());

  step('CJS require');
  console.log(run('node', ['-e', `
    const { version, useVersion, isExcelError, sanitizeSheetName } = require('react-data-export');
    if (version !== ${JSON.stringify(pkg.version)}) throw new Error('bad version ' + version);
    if (typeof useVersion !== 'function') throw new Error('useVersion missing');
    if (sanitizeSheetName('a/b') !== 'a_b' || isExcelError(new Error('x')) !== false) throw new Error('javascript-excel re-exports broken');
    console.log('cjs ok', version);
  `], app).trim());

  step('types (node16 ESM + CJS, bundler)');
  const src = `import { version, useVersion } from 'react-data-export';\nconst v: string = version;\nconst h: () => string = useVersion;\nexport { v, h };\n`;
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
