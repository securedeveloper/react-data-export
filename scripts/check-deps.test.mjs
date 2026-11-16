// Unit tests for check-deps.mjs. Run with `node --test "scripts/*.test.mjs"`.
// Shared verbatim across the four repositories, like check-deps.mjs.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFiles, checkManifest, parseArgs } from "./check-deps.mjs";

describe("checkManifest", () => {
  it("passes when every runtime and peer dependency is allowed", () => {
    assert.deepEqual(checkManifest({ dependencies: { "javascript-excel": "^2" }, peerDependencies: { react: ">=17" } }, { allow: ["javascript-excel"], peer: ["react"] }), []);
    assert.deepEqual(checkManifest({}, { allow: [] }), []);
    assert.deepEqual(checkManifest({ dependencies: {} }, { allow: [] }), []);
  });

  it("fails on a runtime or peer dependency outside the allowlist", () => {
    assert.deepEqual(checkManifest({ dependencies: { "left-pad": "1" } }, { allow: [] }), ['dependencies: "left-pad" is not in the allowlist (none)']);
    assert.deepEqual(checkManifest({ dependencies: { a: "1", b: "1" } }, { allow: ["a"] }), ['dependencies: "b" is not in the allowlist (a)']);
    assert.deepEqual(checkManifest({ peerDependencies: { "react-dom": "*" } }, { allow: [], peer: ["react"] }), ['peerDependencies: "react-dom" is not in the allowlist (react)']);
  });

  it("fails on optional and bundled dependencies", () => {
    assert.equal(checkManifest({ optionalDependencies: { fsevents: "2" } }, { allow: [] }).length, 1);
    assert.equal(checkManifest({ bundleDependencies: ["x"] }, { allow: [] }).length, 1);
    assert.equal(checkManifest({ bundledDependencies: true }, { allow: [] }).length, 1);
    assert.deepEqual(checkManifest({ bundleDependencies: [] }, { allow: [] }), []);
  });
});

describe("checkFiles", () => {
  it("allows package.json, README, LICENSE, CHANGELOG and dist/**", () => {
    assert.deepEqual(checkFiles(["package.json", "README.md", "LICENSE", "CHANGELOG.md", "dist/index.js", "dist/a/b.d.ts"]), []);
  });

  it("fails on anything else, and on a tarball without package.json or dist", () => {
    assert.deepEqual(checkFiles(["package.json", "dist/index.js", "src/index.ts", "apps/playground/index.html"]), [
      "unexpected file in the tarball: src/index.ts",
      "unexpected file in the tarball: apps/playground/index.html",
    ]);
    assert.deepEqual(checkFiles(["package.json", "README.md"]), ["the tarball has no dist/ files (build first)"]);
    assert.deepEqual(checkFiles(["dist/index.js"]), ["the tarball has no package.json"]);
  });
});

describe("parseArgs", () => {
  it("parses the allowlists; an empty --allow means none", () => {
    assert.deepEqual(parseArgs(["--package", "p", "--allow", "", "--pack"]), { package: "p", allow: [], peer: [], pack: true });
    assert.deepEqual(parseArgs(["--package", "p", "--allow", "javascript-excel", "--peer", "react, react-dom"]), { package: "p", allow: ["javascript-excel"], peer: ["react", "react-dom"], pack: false });
  });

  it("requires --package and --allow, and rejects unknown arguments", () => {
    assert.throws(() => parseArgs(["--allow", ""]), /--package/);
    assert.throws(() => parseArgs(["--package", "p"]), /--allow/);
    assert.throws(() => parseArgs(["--package", "p", "--allow", "", "--nope"]), /unknown/);
    assert.throws(() => parseArgs(["--package"]), /needs a value/);
  });
});
