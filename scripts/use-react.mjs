// CI matrix helper: switch the React major used by the library's tests.
// Usage: node scripts/use-react.mjs 17|18|19
//
// Rewrites the react / react-dom / @types / Testing Library devDependency ranges
// of packages/react-data-export (and the playground's) and runs `npm install`, so npm resolves one
// consistent set (a `--no-save` install gets silently overridden by the
// package's own ranges), then resolves a fresh tree without the lockfile. This
// edits the working tree and replaces node_modules: meant for CI jobs (run it
// instead of `npm ci`); locally,
// `git checkout -- package-lock.json '*/*/package.json' && npm ci`
// restores the default.
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const sets = {
  // RTL 13+ requires React 18 (createRoot); 12.1.5 is the last line supporting React 17.
  17: { react: '^17.0.2', 'react-dom': '^17.0.2', '@types/react': '^17.0.0', '@types/react-dom': '^17.0.0', '@testing-library/react': '^12.1.5' },
  18: { react: '^18.3.1', 'react-dom': '^18.3.1', '@types/react': '^18.3.0', '@types/react-dom': '^18.3.0', '@testing-library/react': '^16.3.0' },
  19: null, // the committed default
};

const major = process.argv[2];
if (!(major in sets)) {
  console.error(`usage: use-react.mjs <${Object.keys(sets).join('|')}>`);
  process.exit(1);
}
if (sets[major] === null) {
  console.log(`React ${major} is the committed default; nothing to change.`);
  process.exit(0);
}

const root = resolve(import.meta.dirname, '..');
const sh = (args) => execFileSync('npm', args, { cwd: root, stdio: 'inherit' });
sh(['pkg', 'set', '-w', 'react-data-export', ...Object.entries(sets[major]).map(([k, v]) => `devDependencies.${k}=${v}`)]);
// Align the playground too, so the tree holds one React and a hoisted Testing
// Library can't pick up the playground's React 19. These jobs only test and
// typecheck the library; the playground is built in the default (19) job.
const pinned = Object.entries(sets[major]).filter(([k]) => !k.startsWith('@testing-library/'));
sh(['pkg', 'set', '-w', 'playground', ...pinned.map(([k, v]) => `${k.startsWith('@types/') ? 'devDependencies' : 'dependencies'}.${k}=${v}`)]);
// Resolve from scratch: with the committed lockfile npm keeps the hoisted React 19
// and Testing Library's peer binds to it, which gives two Reacts in one test run.
for (const dir of ['package-lock.json', 'node_modules', 'packages/react-data-export/node_modules', 'apps/playground/node_modules']) {
  rmSync(join(root, dir), { recursive: true, force: true });
}
sh(['install', '--no-audit', '--no-fund']);
