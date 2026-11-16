// Keeps the code in docs/ and the READMEs identical to the type-checked
// examples in examples/ (same convention as javascript-excel's docs:check).
//
// A Markdown file includes an example file with a marker line followed by a
// fenced code block:
//
//   <!-- example: examples/migration/sheets-and-columns.tsx -->
//   ```tsx
//   ...the file's exact content...
//   ```
//
//   node scripts/check-doc-snippets.mjs          fail if any block differs from its file
//   node scripts/check-doc-snippets.mjs --fix    rewrite the blocks from the files
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fix = process.argv.includes('--fix');
const MARKER = /^<!-- example: (\S+) -->\n(`{3,})(\w*)\n(?:\2$|([\s\S]*?)\n\2$)/gm;

const files = ['README.md', 'packages/react-data-export/README.md'];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.md')) files.push(relative(root, p));
  }
})(join(root, 'docs'));

let problems = 0;
let blocks = 0;
for (const file of files) {
  const path = join(root, file);
  const text = readFileSync(path, 'utf8');
  const out = text.replace(MARKER, (whole, src, fence, lang, body) => {
    blocks++;
    const want = readFileSync(join(root, src), 'utf8').replace(/\n$/, '');
    if ((body ?? '') === want) return whole;
    if (!fix) {
      problems++;
      console.error(`${file}: the block for ${src} differs from the file`);
    }
    return `<!-- example: ${src} -->\n${fence}${lang}\n${want}\n${fence}`;
  });
  if (fix && out !== text) writeFileSync(path, out);
}
if (problems) {
  console.error(`${problems} snippet(s) out of date; run: node scripts/check-doc-snippets.mjs --fix`);
  process.exit(1);
}
console.log(`ok ${blocks} example blocks match their files`);
