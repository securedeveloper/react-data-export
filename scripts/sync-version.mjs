#!/usr/bin/env node
// Keeps a version constant in source in step with package.json.
//
// `changeset version` bumps package.json but never touches source files, so a
// constant such as `export const VERSION = "1.2.3";` would go stale on every
// release. `npm run version-packages` runs this right after `changeset
// version`:
//
//   node scripts/sync-version.mjs --package <dir> --file <source file> [--name <const>]
//
// It rewrites exactly one `export const <name> = "<version>";` (single or
// double quotes; <name> defaults to VERSION or version) to <dir>/package.json's
// version, and fails if there is no such constant or more than one, so a
// rename can't silently stop the sync. Running it again is a no-op.
//
// Node built-ins only. Shared verbatim by the spreadsheet-family repositories
// that have a version constant; change it in all of them or not at all.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SEMVER =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function constantPattern(name) {
  const names = name ? [name] : ["VERSION", "version"];
  const alternatives = names.map((n) => n.replace(/[$]/g, "\\$&")).join("|");
  // export const NAME = "x";   or   export const NAME: string = 'x';
  return new RegExp(`^(export const (?:${alternatives})(?:\\s*:\\s*string)?\\s*=\\s*)(["'])([^"'\\n]*)\\2(;?)`, "gm");
}

/**
 * Replace the version constant in `source` with `version`.
 * @returns {{ source: string, previous: string, changed: boolean }}
 */
export function syncVersion(source, version, { name } = {}) {
  if (!SEMVER.test(String(version ?? ""))) {
    throw new Error(`not a semver version: ${JSON.stringify(version)}`);
  }
  const pattern = constantPattern(name);
  const matches = [...String(source).matchAll(pattern)];
  const label = name ? `\`export const ${name}\`` : "`export const VERSION` or `export const version`";
  if (matches.length === 0) throw new Error(`no ${label} string constant found`);
  if (matches.length > 1) throw new Error(`${matches.length} ${label} constants found; expected exactly one`);
  const [, , , previous] = matches[0];
  const next = String(source).replace(pattern, (_m, head, quote, _old, semi) => `${head}${quote}${version}${quote}${semi}`);
  return { source: next, previous, changed: next !== source };
}

function parseArgs(argv) {
  const args = { package: null, file: null, name: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--package") args.package = argv[++i];
    else if (argv[i] === "--file") args.file = argv[++i];
    else if (argv[i] === "--name") args.name = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!args.package || !args.file) throw new Error("usage: sync-version.mjs --package <dir> --file <source file> [--name <const>]");
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const { version } = JSON.parse(readFileSync(join(args.package, "package.json"), "utf8"));
  const before = readFileSync(args.file, "utf8");
  const result = syncVersion(before, version, { name: args.name });
  if (result.changed) {
    writeFileSync(args.file, result.source);
    console.log(`${args.file}: version constant ${result.previous} -> ${version}`);
  } else {
    console.log(`${args.file}: version constant already ${version}`);
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (err) {
    console.error(`sync-version: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
