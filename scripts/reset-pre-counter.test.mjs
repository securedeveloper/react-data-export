// Tests for scripts/reset-pre-counter.mjs. Run: node --test "scripts/*.test.mjs"
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main, parsePrerelease, resetVersion, rewriteChangelog, rewritePackageJson } from "./reset-pre-counter.mjs";

describe("parsePrerelease", () => {
  it("parses <x.y.z>-<tag>.<n>", () => {
    assert.deepEqual(parsePrerelease("2.0.0-beta.8"), { base: "2.0.0", tag: "beta", n: 8 });
  });
  it("returns null for final versions and other shapes", () => {
    assert.equal(parsePrerelease("2.0.0"), null);
    assert.equal(parsePrerelease("2.0.0-beta"), null);
    assert.equal(parsePrerelease("2.0.0-beta.1.2"), null);
    assert.equal(parsePrerelease(undefined), null);
  });
});

describe("resetVersion", () => {
  it("resets the counter when the tag changes", () => {
    assert.equal(resetVersion("2.0.0-alpha.7", "2.0.0-beta.8"), "2.0.0-beta.0");
    assert.equal(resetVersion("2.0.0-beta.3", "2.0.0-rc.4"), "2.0.0-rc.0");
  });
  it("leaves a same-tag release alone", () => {
    assert.equal(resetVersion("2.0.0-alpha.7", "2.0.0-alpha.8"), null);
  });
  it("leaves a first prerelease and a final version alone", () => {
    assert.equal(resetVersion("1.0.3", "2.0.0-alpha.0"), null);
    assert.equal(resetVersion("2.0.0-beta.4", "2.0.0"), null);
  });
  it("is a no-op once reset", () => {
    assert.equal(resetVersion("2.0.0-alpha.7", "2.0.0-beta.0"), null);
  });
});

describe("rewritePackageJson", () => {
  it("rewrites the version and dependencies, keeping range prefixes and formatting", () => {
    const src = '{\n  "name": "x",\n  "version": "2.0.0-beta.8",\n  "dependencies": {\n    "a": "2.0.0-beta.8",\n    "b": "^2.0.0-beta.8",\n    "c": "~2.0.0-beta.8",\n    "d": "workspace:^2.0.0-beta.8"\n  }\n}\n';
    assert.equal(
      rewritePackageJson(src, "2.0.0-beta.8", "2.0.0-beta.0"),
      '{\n  "name": "x",\n  "version": "2.0.0-beta.0",\n  "dependencies": {\n    "a": "2.0.0-beta.0",\n    "b": "^2.0.0-beta.0",\n    "c": "~2.0.0-beta.0",\n    "d": "workspace:^2.0.0-beta.0"\n  }\n}\n',
    );
  });
  it("does not touch other versions or longer versions that contain it", () => {
    const src = '{ "a": "2.0.0-beta.80", "b": "12.0.0-beta.8", "c": "1.0.0" }';
    assert.equal(rewritePackageJson(src, "2.0.0-beta.8", "2.0.0-beta.0"), src);
  });
});

describe("rewriteChangelog", () => {
  it("rewrites only the matching heading", () => {
    const src = "# pkg\n\n## 2.0.0-beta.8\n\n- see 2.0.0-beta.8\n\n## 2.0.0-alpha.7\n";
    assert.equal(rewriteChangelog(src, "2.0.0-beta.8", "2.0.0-beta.0"), "# pkg\n\n## 2.0.0-beta.0\n\n- see 2.0.0-beta.8\n\n## 2.0.0-alpha.7\n");
  });
  it("fails without exactly one heading", () => {
    assert.throws(() => rewriteChangelog("# pkg\n", "2.0.0-beta.8", "2.0.0-beta.0"), /found 0/);
  });
});

describe("main", () => {
  function fixture(version, { changelog = `# p\n\n## ${version}\n\n- x\n` } = {}) {
    const dir = mkdtempSync(join(tmpdir(), "reset-pre-counter-"));
    mkdirSync(join(dir, "packages", "p"), { recursive: true });
    mkdirSync(join(dir, "apps", "a"), { recursive: true });
    const pkg = join(dir, "packages", "p", "package.json");
    const app = join(dir, "apps", "a", "package.json");
    writeFileSync(pkg, `{\n  "name": "p",\n  "version": "${version}"\n}\n`);
    writeFileSync(app, `{\n  "name": "a",\n  "dependencies": { "p": "${version}" }\n}\n`);
    writeFileSync(join(dir, "packages", "p", "CHANGELOG.md"), changelog);
    return { dir, pkg, app, changelog: join(dir, "packages", "p", "CHANGELOG.md") };
  }
  const quiet = (fn) => {
    const log = console.log;
    console.log = () => {};
    try {
      return fn();
    } finally {
      console.log = log;
    }
  };

  it("resets every changed file when the tag changed", () => {
    const f = fixture("2.0.0-beta.8");
    try {
      const r = quiet(() =>
        main(["--package", join(f.dir, "packages", "p")], {
          readCommitted: () => '{ "version": "2.0.0-alpha.7" }',
          changedFiles: () => [f.pkg, f.app],
        }),
      );
      assert.equal(r.version, "2.0.0-beta.0");
      assert.match(readFileSync(f.pkg, "utf8"), /"version": "2.0.0-beta.0"/);
      assert.match(readFileSync(f.app, "utf8"), /"p": "2.0.0-beta.0"/);
      assert.match(readFileSync(f.changelog, "utf8"), /^## 2.0.0-beta.0$/m);
    } finally {
      rmSync(f.dir, { recursive: true, force: true });
    }
  });

  it("changes nothing for a same-tag release", () => {
    const f = fixture("2.0.0-alpha.8");
    try {
      const before = readFileSync(f.pkg, "utf8");
      const r = quiet(() =>
        main(["--package", join(f.dir, "packages", "p")], {
          readCommitted: () => '{ "version": "2.0.0-alpha.7" }',
          changedFiles: () => [f.pkg, f.app],
        }),
      );
      assert.equal(r.changed, false);
      assert.equal(readFileSync(f.pkg, "utf8"), before);
    } finally {
      rmSync(f.dir, { recursive: true, force: true });
    }
  });

  it("changes nothing when the package is not committed yet", () => {
    const f = fixture("2.0.0-beta.8");
    try {
      const r = quiet(() =>
        main(["--package", join(f.dir, "packages", "p")], {
          readCommitted: () => {
            throw new Error("fatal: path not in HEAD");
          },
          changedFiles: () => [f.pkg],
        }),
      );
      assert.equal(r.changed, false);
    } finally {
      rmSync(f.dir, { recursive: true, force: true });
    }
  });

  it("fails when the package's own package.json is not among the changed files", () => {
    const f = fixture("2.0.0-beta.8");
    try {
      assert.throws(
        () =>
          quiet(() =>
            main(["--package", join(f.dir, "packages", "p")], {
              readCommitted: () => '{ "version": "2.0.0-alpha.7" }',
              changedFiles: () => [f.app],
            }),
          ),
        /was not rewritten/,
      );
    } finally {
      rmSync(f.dir, { recursive: true, force: true });
    }
  });

  it("rejects unknown arguments", () => {
    assert.throws(() => main(["--file", "x"]), /unknown argument/);
  });
});
