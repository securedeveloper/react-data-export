// Unit tests for release-check.mjs. Run with `node --test "scripts/*.test.mjs"`.
// Shared verbatim across the four repositories, like release-check.mjs.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  changelogSection,
  decide,
  EVENTS,
  isPrerelease,
  npmVersionOk,
  parseArgs,
  parseNpmView,
  parseVersion,
} from "./release-check.mjs";

const name = "example-pkg";

describe("decide", () => {
  const cases = [
    {
      title: "changed and unpublished: release on latest",
      input: { version: "1.1.0", previousVersion: "1.0.0", publishedVersion: null },
      expect: { release: true, distTag: "latest", prerelease: false, published: false, versionChanged: true, tag: true },
    },
    {
      title: "unchanged: skip",
      input: { version: "1.0.0", previousVersion: "1.0.0", publishedVersion: "1.0.0" },
      expect: { release: false, distTag: "latest", published: true, versionChanged: false, tag: false },
    },
    {
      title: "unchanged and unpublished (e.g. 2.0.0-alpha.0 never released): skip",
      input: { version: "2.0.0-alpha.0", previousVersion: "2.0.0-alpha.0", publishedVersion: null },
      expect: { release: false, distTag: "next", published: false, versionChanged: false, tag: false },
    },
    {
      title: "changed but already on npm (re-run after publish): skip publish, still tag",
      input: { version: "1.1.0", previousVersion: "1.0.0", publishedVersion: "1.1.0" },
      expect: { release: false, published: true, versionChanged: true, tag: true },
    },
    {
      title: "prerelease: release on next",
      input: { version: "2.0.0-beta.1", previousVersion: "2.0.0-beta.0", publishedVersion: null },
      expect: { release: true, distTag: "next", prerelease: true },
    },
    {
      title: "leaving pre mode: 2.0.0-rc.3 -> 2.0.0 goes to latest",
      input: { version: "2.0.0", previousVersion: "2.0.0-rc.3", publishedVersion: null },
      expect: { release: true, distTag: "latest", prerelease: false },
    },
    {
      title: "no previous commit or file: release when unpublished",
      input: { version: "0.1.0", previousVersion: null, publishedVersion: null },
      expect: { release: true, distTag: "latest" },
    },
    {
      title: "private package: never",
      input: { version: "1.1.0", previousVersion: "1.0.0", publishedVersion: null, isPrivate: true },
      expect: { release: false, versionChanged: false, tag: false },
    },
    // Manual runs (workflow_dispatch): the recovery path.
    {
      title: "manual, unchanged and unpublished (push release job failed before publish): release",
      input: { version: "2.0.0-alpha.1", previousVersion: "2.0.0-alpha.1", publishedVersion: null, manual: true },
      expect: { release: true, distTag: "next", prerelease: true, published: false, versionChanged: false, tag: true },
    },
    {
      title: "manual, already on npm: skip publish, still (re)create a missing tag",
      input: { version: "2.0.0-alpha.1", previousVersion: "2.0.0-alpha.1", publishedVersion: "2.0.0-alpha.1", manual: true },
      expect: { release: false, published: true, versionChanged: false, tag: true },
    },
    {
      title: "manual, changed and unpublished: release on latest",
      input: { version: "1.1.0", previousVersion: "1.0.0", publishedVersion: null, manual: true },
      expect: { release: true, distTag: "latest", versionChanged: true, tag: true },
    },
    {
      title: "manual, private package: never",
      input: { version: "1.1.0", previousVersion: "1.1.0", publishedVersion: null, isPrivate: true, manual: true },
      expect: { release: false, tag: false },
    },
  ];
  for (const c of cases) {
    it(c.title, () => {
      const out = decide({ name, ...c.input });
      for (const [k, v] of Object.entries(c.expect)) assert.equal(out[k], v, k);
      assert.equal(typeof out.reason, "string");
    });
  }

  it("rejects a non-semver version", () => {
    assert.throws(() => decide({ name, version: "latest", previousVersion: null, publishedVersion: null }));
  });

  it("a push never releases an unchanged version, even when it is not on npm", () => {
    const out = decide({ name, version: "2.0.0-alpha.1", previousVersion: "2.0.0-alpha.1", publishedVersion: null, manual: false });
    assert.equal(out.release, false);
    assert.equal(out.tag, false);
  });
});

describe("parseArgs", () => {
  it("defaults to the push event", () => {
    assert.equal(parseArgs(["--package", "pkg"]).event, "push");
  });

  it("accepts every known event", () => {
    for (const e of EVENTS) assert.equal(parseArgs(["--package", "pkg", "--event", e]).event, e);
    assert.deepEqual(EVENTS, ["push", "pull_request", "workflow_dispatch"]);
  });

  it("rejects an unknown event (fail closed)", () => {
    assert.throws(() => parseArgs(["--package", "pkg", "--event", "schedule"]), /--event must be one of/);
    assert.throws(() => parseArgs(["--package", "pkg", "--event"]), /--event must be one of/);
  });

  it("rejects unknown arguments", () => {
    assert.throws(() => parseArgs(["--package", "pkg", "--force"]), /unknown argument/);
  });
});

describe("parseNpmView", () => {
  it("published version (npm view --json prints a JSON string)", () => {
    assert.equal(parseNpmView({ status: 0, stdout: '"1.0.3"\n', stderr: "" }), "1.0.3");
  });
  it("unknown version of an existing package: E404 means unpublished", () => {
    const stdout = JSON.stringify({ error: { code: "E404", summary: "No match found for version 9.9.9" } });
    assert.equal(parseNpmView({ status: 1, stdout, stderr: "npm error code E404\n" }), null);
  });
  it("unknown package: E404 means unpublished", () => {
    assert.equal(parseNpmView({ status: 1, stdout: "", stderr: "npm error code E404\nnpm error 404 Not Found" }), null);
  });
  it("empty output with exit 0 (older npm) means unpublished", () => {
    assert.equal(parseNpmView({ status: 0, stdout: "", stderr: "" }), null);
  });
  it("any other failure throws (fail closed)", () => {
    assert.throws(
      () => parseNpmView({ status: 1, stdout: "", stderr: "npm error code ETIMEDOUT" }),
      /npm view failed/,
    );
  });
});

describe("npmVersionOk", () => {
  it("accepts 11.5.1 and newer", () => {
    for (const v of ["11.5.1", "11.16.0", "12.0.0"]) assert.equal(npmVersionOk(v), true, v);
  });
  it("rejects older", () => {
    for (const v of ["11.5.0", "11.4.9", "10.9.2", "11.5.1-rc.0"]) assert.equal(npmVersionOk(v), false, v);
  });
});

describe("versions", () => {
  it("isPrerelease", () => {
    assert.equal(isPrerelease("2.0.0-alpha.0"), true);
    assert.equal(isPrerelease("2.0.0"), false);
    assert.equal(isPrerelease("2.0.0+build.1"), false);
  });
  it("parseVersion rejects ranges", () => {
    assert.throws(() => parseVersion("^1.0.0"));
  });
});

describe("changelogSection", () => {
  const md = [
    "# example-pkg",
    "",
    "## 1.1.0",
    "",
    "### Minor Changes",
    "",
    "- abc1234: Add the thing.",
    "",
    "## 1.0.0",
    "",
    "### Major Changes",
    "",
    "- def5678: First release.",
    "",
  ].join("\n");

  it("returns the section body up to the next version heading", () => {
    assert.equal(changelogSection(md, "1.1.0"), "### Minor Changes\n\n- abc1234: Add the thing.");
  });
  it("last section runs to the end of the file", () => {
    assert.equal(changelogSection(md, "1.0.0"), "### Major Changes\n\n- def5678: First release.");
  });
  it("missing version: null", () => {
    assert.equal(changelogSection(md, "9.9.9"), null);
  });
  it("does not match a version that only shares a prefix", () => {
    assert.equal(changelogSection("## 1.1.0-beta.1\n\n- x\n", "1.1.0"), null);
  });
  it("prerelease versions and CRLF line endings", () => {
    assert.equal(changelogSection("## 2.0.0-beta.1\r\n\r\n- y\r\n", "2.0.0-beta.1"), "- y");
  });
});
