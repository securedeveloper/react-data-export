#!/usr/bin/env node
// Restarts the prerelease counter at 0 when the prerelease tag changes.
//
// Changesets 3 computes the next prerelease number from the package's current
// version (`prerelease[1] + 1`) and keeps counting when the tag in
// `.changeset/pre.json` changes. Switching from alpha to beta after
// 2.0.0-alpha.7 therefore gives 2.0.0-beta.8. `npm run version-packages` runs
// this right after `changeset version`:
//
//   node scripts/reset-pre-counter.mjs --package <dir>
//
// It compares <dir>/package.json's version with the one committed at HEAD.
// When both are prereleases of the form <x.y.z>-<tag>.<n> and the tag
// differs, it rewrites the new version to <x.y.z>-<tag>.0 in:
//   - every package.json that has uncommitted changes (the package's own
//     "version" and any dependency on it, with or without ^, ~ or workspace:),
//   - the "## <version>" heading of <dir>/CHANGELOG.md.
// The version constant sync and the lockfile update run after it. A release
// with the same tag (alpha.7 -> alpha.8), a first prerelease (1.0.3 ->
// 2.0.0-alpha.0) or a final version (2.0.0) is left alone. Running it again is
// a no-op.
//
// Node built-ins and git only. Shared verbatim by the spreadsheet-family
// repositories; change it in all of them or not at all.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PRERELEASE = /^(\d+\.\d+\.\d+)-([0-9A-Za-z-]+)\.(\d+)$/;

/** Parse "2.0.0-beta.8" into { base, tag, n }, or null for anything else. */
export function parsePrerelease(version) {
  const m = PRERELEASE.exec(String(version ?? ""));
  return m ? { base: m[1], tag: m[2], n: Number(m[3]) } : null;
}

/**
 * The version `next` should be, given the `previous` (committed) version.
 * @returns {string | null} the reset version, or null when nothing changes.
 */
export function resetVersion(previous, next) {
  const before = parsePrerelease(previous);
  const after = parsePrerelease(next);
  if (!before || !after || before.tag === after.tag || after.n === 0) return null;
  return `${after.base}-${after.tag}.0`;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace `"from"` (optionally prefixed with workspace:, ^ or ~) as a JSON string value. */
export function rewritePackageJson(text, from, to) {
  const pattern = new RegExp(`"((?:workspace:)?[\\^~]?)${escapeRegExp(from)}"`, "g");
  return String(text).replace(pattern, (_m, prefix) => `"${prefix}${to}"`);
}

/** Replace the one "## from" heading. Fails unless there is exactly one. */
export function rewriteChangelog(text, from, to) {
  const pattern = new RegExp(`^## ${escapeRegExp(from)}[ \\t]*$`, "gm");
  const count = [...String(text).matchAll(pattern)].length;
  if (count !== 1) throw new Error(`expected exactly one "## ${from}" heading in CHANGELOG.md, found ${count}`);
  return String(text).replace(pattern, `## ${to}`);
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function parseArgs(argv) {
  const args = { package: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--package") args.package = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!args.package) throw new Error("usage: reset-pre-counter.mjs --package <dir>");
  return args;
}

export function main(argv = process.argv.slice(2), { readCommitted = (path) => git(["show", `HEAD:${path}`]), changedFiles } = {}) {
  const args = parseArgs(argv);
  const pkgPath = join(args.package, "package.json");
  const next = JSON.parse(readFileSync(pkgPath, "utf8")).version;
  let previous;
  try {
    previous = JSON.parse(readCommitted(pkgPath.split("\\").join("/"))).version;
  } catch {
    console.log(`${pkgPath}: not committed at HEAD; prerelease counter left alone`);
    return { changed: false, version: next };
  }
  const target = resetVersion(previous, next);
  if (target == null) {
    console.log(`${pkgPath}: ${previous} -> ${next}; prerelease counter left alone`);
    return { changed: false, version: next };
  }
  const files = (changedFiles ?? (() => git(["diff", "--name-only", "--", "*package.json"]).split("\n").filter(Boolean)))();
  const touched = [];
  for (const file of files) {
    const before = readFileSync(file, "utf8");
    const after = rewritePackageJson(before, next, target);
    if (after !== before) {
      writeFileSync(file, after);
      touched.push(file);
    }
  }
  if (!touched.includes(pkgPath)) throw new Error(`${pkgPath} was not rewritten; is it in the list of changed files?`);
  const changelog = join(args.package, "CHANGELOG.md");
  writeFileSync(changelog, rewriteChangelog(readFileSync(changelog, "utf8"), next, target));
  touched.push(changelog);
  console.log(`prerelease tag changed (${previous} -> ${next}): counter reset to ${target} in ${touched.join(", ")}`);
  return { changed: true, version: target, files: touched };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (err) {
    console.error(`reset-pre-counter: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
