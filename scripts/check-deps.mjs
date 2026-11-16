#!/usr/bin/env node
// Dependency guard for the published package (OPS-11).
//
// Fails (exit 1) when the package at --package:
//   - declares a runtime `dependencies` entry that is not in --allow,
//   - declares a `peerDependencies` entry that is not in --peer,
//   - declares any `optionalDependencies` or `bundleDependencies`, or
//   - with --pack: would publish anything other than package.json, README.md,
//     LICENSE, CHANGELOG.md and dist/** (`npm pack --dry-run`), so private
//     workspaces, sources, tests and fixtures never leak into the tarball.
//
// Usage (in CI, after the package is built):
//   node scripts/check-deps.mjs --package <dir> --allow <a,b|''> [--peer <x,y>] [--pack]
//
// Adding a runtime dependency is a decision: change the allowlist in CI in the
// same pull request, so it's reviewed.
//
// Node built-ins only. Shared verbatim by the javascript-excel,
// react-data-export, react-data-import and react-xlsx-viewer repositories;
// change it in all four or not at all.

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Files a published package may contain, besides dist/**. */
export const ALLOWED_FILES = ["package.json", "README.md", "LICENSE", "CHANGELOG.md"];

const list = (s) => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/** Problems with the manifest's dependency fields, as messages; [] when it passes. */
export function checkManifest(manifest, { allow = [], peer = [] } = {}) {
  const problems = [];
  const keys = (field) => Object.keys(manifest[field] ?? {});
  for (const name of keys("dependencies")) {
    if (!allow.includes(name)) problems.push(`dependencies: "${name}" is not in the allowlist (${allow.length ? allow.join(", ") : "none"})`);
  }
  for (const name of keys("peerDependencies")) {
    if (!peer.includes(name)) problems.push(`peerDependencies: "${name}" is not in the allowlist (${peer.length ? peer.join(", ") : "none"})`);
  }
  for (const name of keys("optionalDependencies")) problems.push(`optionalDependencies: "${name}" (none are allowed)`);
  for (const field of ["bundleDependencies", "bundledDependencies"]) {
    const v = manifest[field];
    if (v === true || (Array.isArray(v) && v.length) || (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length)) {
      problems.push(`${field}: bundled dependencies are not allowed`);
    }
  }
  return problems;
}

/** Problems with the tarball's file list (paths relative to the package); [] when it passes. */
export function checkFiles(files) {
  const problems = [];
  if (!files.includes("package.json")) problems.push("the tarball has no package.json");
  if (!files.some((f) => f.startsWith("dist/"))) problems.push("the tarball has no dist/ files (build first)");
  for (const f of files) {
    if (!ALLOWED_FILES.includes(f) && !f.startsWith("dist/")) problems.push(`unexpected file in the tarball: ${f}`);
  }
  return problems;
}

export function parseArgs(argv) {
  const args = { package: undefined, allow: undefined, peer: [], pack: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pack") args.pack = true;
    else if (a === "--package" || a === "--allow" || a === "--peer") {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      if (a === "--package") args.package = v;
      else args[a.slice(2)] = list(v);
    } else throw new Error(`unknown argument ${a}`);
  }
  if (!args.package) throw new Error("--package is required");
  if (args.allow === undefined) throw new Error("--allow is required (use --allow '' for none)");
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(readFileSync(join(args.package, "package.json"), "utf8"));
  const problems = checkManifest(manifest, args);
  let files = [];
  if (args.pack) {
    const out = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: args.package, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
    files = JSON.parse(out)[0].files.map((f) => f.path);
    problems.push(...checkFiles(files));
  }
  const deps = Object.keys(manifest.dependencies ?? {});
  const peers = Object.keys(manifest.peerDependencies ?? {});
  const summary = `${manifest.name}: dependencies [${deps.join(", ") || "none"}], peers [${peers.join(", ") || "none"}]${args.pack ? `, ${files.length} files in the tarball` : ""}`;
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${problems.length ? "dependency guard FAILED" : "dependency guard ok"}: ${summary}\n`);
  if (problems.length) {
    for (const p of problems) console.error(`check-deps: ${p}`);
    process.exit(1);
  }
  console.log(`check-deps ok: ${summary}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
