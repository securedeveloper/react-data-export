#!/usr/bin/env node
// Release detection for .github/workflows/release.yml.
//
// A push to main is a release only when BOTH hold:
//   (a) the package version differs from the previous commit (HEAD~1), and
//   (b) that name@version is not on npm yet.
// Everything else (docs, CI, feature PRs without a version bump, re-runs after
// a publish) exits 0 with release=false.
//
// A manual run (`--event workflow_dispatch`, the recovery path) skips (a): it
// releases whenever name@version is not on npm yet, for example after a push
// whose release job failed before publishing. npm errors still fail closed.
// A manual run also requires a `## <version>` section in <package
// dir>/CHANGELOG.md, i.e. a version cut by `npm run version-packages`;
// otherwise it fails (exit 1) and publishes and tags nothing, so a scaffold
// or hand-edited version can't be published by hand.
//
// Usage (in CI):
//   node scripts/release-check.mjs --package <dir> [--event <push|pull_request|workflow_dispatch>] [--notes-out <file>]
//
// Writes `release`, `name`, `version`, `dist-tag`, `prerelease`, `published`
// (name@version already on npm), `version-changed` (differs from HEAD~1) and
// `tag` (run the idempotent tag + GitHub Release step: version changed, or a
// manual run) to $GITHUB_OUTPUT, a one-line verdict to $GITHUB_STEP_SUMMARY
// and, when `tag` is true, the release notes to --notes-out: that version's
// section of <package dir>/CHANGELOG.md, or a one-line fallback.
//
// Node built-ins only. This file is shared verbatim by the javascript-excel,
// react-data-export, react-data-import and react-xlsx-viewer repositories;
// change it in all four or not at all.

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, posix } from "node:path";
import { pathToFileURL } from "node:url";

/** Minimum npm CLI for trusted publishing (OIDC). */
export const MIN_NPM = "11.5.1";

const SEMVER =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** Parse a semver string, or throw. */
export function parseVersion(version) {
  const m = SEMVER.exec(String(version ?? "").trim());
  if (!m) throw new Error(`not a semver version: ${JSON.stringify(version)}`);
  return { major: +m[1], minor: +m[2], patch: +m[3], prerelease: m[4] ?? "" };
}

/** True when `version` has a prerelease part (2.0.0-beta.1). */
export function isPrerelease(version) {
  return parseVersion(version).prerelease !== "";
}

/** True when the npm CLI version is new enough for trusted publishing. */
export function npmVersionOk(version, min = MIN_NPM) {
  const a = parseVersion(version);
  const b = parseVersion(min);
  for (const k of ["major", "minor", "patch"]) {
    if (a[k] !== b[k]) return a[k] > b[k];
  }
  // Same x.y.z: a prerelease of the minimum (11.5.1-rc) is older than it.
  return a.prerelease === "" || b.prerelease !== "";
}

/**
 * Decide whether to publish.
 * @param {object} input
 * @param {string} input.name             package name
 * @param {string} input.version          version in package.json at HEAD
 * @param {string|null} input.previousVersion  version at HEAD~1 (null: file or commit missing)
 * @param {string|null} input.publishedVersion `npm view name@version version` (null: not on npm)
 * @param {boolean} [input.isPrivate]     package.json "private"
 * @param {boolean} [input.manual]        workflow_dispatch: release whenever not on npm, even if unchanged
 * @param {boolean} [input.changelogHasVersion] the package CHANGELOG.md has a `## <version>` section (required for manual runs)
 */
export function decide({ name, version, previousVersion, publishedVersion, isPrivate = false, manual = false, changelogHasVersion = true }) {
  parseVersion(version);
  const distTag = isPrerelease(version) ? "next" : "latest";
  const base = {
    name,
    version,
    distTag,
    prerelease: distTag === "next",
    published: Boolean(publishedVersion),
    // Drives the (idempotent) tag + GitHub Release step, so a re-run after a
    // successful publish but a failed `gh release create` still tags it.
    versionChanged: previousVersion !== version,
    // A manual run may also (re)create a missing tag/Release for the current version.
    tag: previousVersion !== version || manual,
    // A manual run that must not act at all; the CLI exits non-zero.
    refused: false,
  };
  if (isPrivate) return { ...base, versionChanged: false, tag: false, release: false, reason: `${name} is private` };
  if (manual) {
    if (!changelogHasVersion) {
      return {
        ...base,
        release: false,
        tag: false,
        refused: true,
        reason:
          `manual run refused: CHANGELOG.md has no "## ${version}" section, so ${version} was not cut by ` +
          "`npm run version-packages`; nothing is published or tagged",
      };
    }
    if (publishedVersion) {
      return { ...base, release: false, reason: `manual run: ${name}@${version} is already on npm` };
    }
    return { ...base, release: true, reason: `manual run: ${version} not on npm yet: publish with --tag ${distTag}` };
  }
  if (previousVersion === version) {
    return { ...base, release: false, reason: `version ${version} unchanged since the previous commit` };
  }
  if (publishedVersion) {
    return { ...base, release: false, reason: `${name}@${version} is already on npm` };
  }
  const from = previousVersion ? `${previousVersion} -> ${version}` : `new ${version}`;
  return { ...base, release: true, reason: `${from}, not on npm yet: publish with --tag ${distTag}` };
}

/**
 * Interpret `npm view <name>@<version> version --json`. Returns the published
 * version, or null when npm reports it does not exist. Any other failure
 * throws, so a registry outage never turns into a publish attempt.
 */
export function parseNpmView({ status, stdout, stderr }) {
  const out = String(stdout ?? "").trim();
  if (status === 0) {
    if (out === "") return null; // older npm: unknown version prints nothing
    const parsed = JSON.parse(out);
    const v = Array.isArray(parsed) ? parsed.at(-1) : parsed;
    return typeof v === "string" && v !== "" ? v : null;
  }
  const text = `${out}\n${stderr ?? ""}`;
  if (/\bE404\b/.test(text)) return null;
  throw new Error(`npm view failed (exit ${status}):\n${text.trim()}`);
}

/**
 * The CHANGELOG.md section for `version`, as written by `changeset version`
 * (`## 1.2.3` up to the next `## ` heading). Returns null when absent.
 */
export function changelogSection(markdown, version) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = new RegExp(`^##\\s+\\[?v?${escaped}\\]?(?:\\s|$)`);
  const start = lines.findIndex((l) => heading.test(l));
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end === -1) end = lines.length;
  const body = lines.slice(start + 1, end).join("\n").trim();
  return body === "" ? null : body;
}

function sh(cmd, args, opts = {}) {
  try {
    const stdout = execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    return { status: err.status ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? String(err) };
  }
}

/** Events the release check understands; anything else fails closed. */
export const EVENTS = ["push", "pull_request", "workflow_dispatch"];

export function parseArgs(argv) {
  const args = { package: ".", notesOut: null, event: "push" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--package") args.package = argv[++i];
    else if (argv[i] === "--notes-out") args.notesOut = argv[++i];
    else if (argv[i] === "--event") args.event = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!args.package) throw new Error("--package needs a directory");
  if (!EVENTS.includes(args.event)) throw new Error(`--event must be one of ${EVENTS.join(", ")}; got ${JSON.stringify(args.event)}`);
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const pkgPath = join(args.package, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  const npm = sh("npm", ["--version"]);
  if (npm.status !== 0) throw new Error(`npm --version failed: ${npm.stderr}`);
  const npmVersion = npm.stdout.trim();
  if (!npmVersionOk(npmVersion)) {
    throw new Error(`npm ${npmVersion} is too old for trusted publishing; need >= ${MIN_NPM}`);
  }

  // git paths are repo-relative with forward slashes.
  const gitPath = posix.normalize(posix.join(args.package.split("\\").join("/"), "package.json"));
  const prev = sh("git", ["show", `HEAD~1:${gitPath}`]);
  const previousVersion = prev.status === 0 ? (JSON.parse(prev.stdout).version ?? null) : null;

  const view = sh("npm", ["view", `${pkg.name}@${pkg.version}`, "version", "--json"]);
  const publishedVersion = parseNpmView(view);

  const changelog = join(args.package, "CHANGELOG.md");
  const section = existsSync(changelog) ? changelogSection(readFileSync(changelog, "utf8"), pkg.version) : null;

  const result = decide({
    name: pkg.name,
    version: pkg.version,
    previousVersion,
    publishedVersion,
    isPrivate: pkg.private === true,
    manual: args.event === "workflow_dispatch",
    changelogHasVersion: section !== null,
  });

  console.log(`npm ${npmVersion}; ${pkg.name}: HEAD ${pkg.version}, HEAD~1 ${previousVersion ?? "(none)"}, npm ${publishedVersion ?? "(not published)"}`);
  console.log(`${result.release ? "release" : "no release"}: ${result.reason}`);

  if (result.tag && args.notesOut) {
    writeFileSync(args.notesOut, `${section ?? `Release ${pkg.version}.`}\n`);
    if (!section) console.log(`note: no CHANGELOG.md section for ${pkg.version}; using a one-line note`);
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      [
        `release=${result.release}`,
        `name=${result.name}`,
        `version=${result.version}`,
        `dist-tag=${result.distTag}`,
        `prerelease=${result.prerelease}`,
        `published=${result.published}`,
        `version-changed=${result.versionChanged}`,
        `tag=${result.tag}`,
        "",
      ].join("\n"),
    );
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `**${result.release ? "Release" : "No release"}** of \`${result.name}@${result.version}\`: ${result.reason}\n`,
    );
  }
  // Outputs and summary are written first, so the refusal is visible on the run page.
  if (result.refused) throw new Error(result.reason);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
