// Tests for scripts/sync-version.mjs. Run: node --test "scripts/*.test.mjs"
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main, syncVersion } from "./sync-version.mjs";

describe("syncVersion", () => {
  it("rewrites a double-quoted VERSION constant", () => {
    const src = 'export const A = 1;\n/** Package version. */\nexport const VERSION = "2.0.0-alpha.0";\nexport const B = 2;\n';
    const r = syncVersion(src, "2.0.0-alpha.1");
    assert.equal(r.source, 'export const A = 1;\n/** Package version. */\nexport const VERSION = "2.0.0-alpha.1";\nexport const B = 2;\n');
    assert.equal(r.previous, "2.0.0-alpha.0");
    assert.equal(r.changed, true);
  });

  it("rewrites a single-quoted lowercase version constant and keeps the quote style", () => {
    const r = syncVersion("export const version = '1.0.0-alpha.0';\n", "1.0.0-alpha.1");
    assert.equal(r.source, "export const version = '1.0.0-alpha.1';\n");
  });

  it("accepts a `: string` annotation", () => {
    const r = syncVersion('export const VERSION: string = "1.0.0";\n', "1.1.0");
    assert.equal(r.source, 'export const VERSION: string = "1.1.0";\n');
  });

  it("is a no-op when already in sync", () => {
    const src = 'export const VERSION = "1.2.3";\n';
    const r = syncVersion(src, "1.2.3");
    assert.equal(r.changed, false);
    assert.equal(r.source, src);
  });

  it("only touches the constant, not other occurrences of the old version", () => {
    const src = '// was "1.0.0"\nexport const VERSION = "1.0.0";\nconst note = "1.0.0";\n';
    const r = syncVersion(src, "1.0.1");
    assert.equal(r.source, '// was "1.0.0"\nexport const VERSION = "1.0.1";\nconst note = "1.0.0";\n');
  });

  it("--name selects a specific constant", () => {
    const src = 'export const VERSION = "1.0.0";\nexport const PKG_VERSION = "1.0.0";\n';
    const r = syncVersion(src, "2.0.0", { name: "PKG_VERSION" });
    assert.equal(r.source, 'export const VERSION = "1.0.0";\nexport const PKG_VERSION = "2.0.0";\n');
  });

  it("fails when there is no constant (a rename must not silently stop the sync)", () => {
    assert.throws(() => syncVersion('export const PKG = "1.0.0";\n', "1.0.1"), /no `export const VERSION` or `export const version`/);
  });

  it("fails when there is more than one constant", () => {
    const src = 'export const VERSION = "1.0.0";\nexport const version = "1.0.0";\n';
    assert.throws(() => syncVersion(src, "1.0.1"), /2 .* constants found; expected exactly one/);
  });

  it("ignores a non-exported or indented constant", () => {
    assert.throws(() => syncVersion('const VERSION = "1.0.0";\n  export const VERSION = "1.0.0";\n', "1.0.1"), /no /);
  });

  it("rejects a non-semver version", () => {
    assert.throws(() => syncVersion('export const VERSION = "1.0.0";\n', "^1.0.0"), /not a semver version/);
  });
});

describe("sync-version CLI", () => {
  function fixture(version, source) {
    const dir = mkdtempSync(join(tmpdir(), "sync-version-"));
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fixture", version }));
    writeFileSync(join(dir, "src/index.ts"), source);
    return dir;
  }

  it("writes package.json's version into the file", () => {
    const dir = fixture("3.1.0-beta.2", 'export const VERSION = "3.1.0-beta.1";\n');
    try {
      const r = main(["--package", dir, "--file", join(dir, "src/index.ts")]);
      assert.equal(r.changed, true);
      assert.equal(readFileSync(join(dir, "src/index.ts"), "utf8"), 'export const VERSION = "3.1.0-beta.2";\n');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("leaves the file untouched when in sync", () => {
    const dir = fixture("1.0.0", "export const version = '1.0.0';\n");
    try {
      const r = main(["--package", dir, "--file", join(dir, "src/index.ts")]);
      assert.equal(r.changed, false);
      assert.equal(readFileSync(join(dir, "src/index.ts"), "utf8"), "export const version = '1.0.0';\n");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("requires --package and --file", () => {
    assert.throws(() => main(["--package", "."]), /usage: sync-version\.mjs/);
  });
});
