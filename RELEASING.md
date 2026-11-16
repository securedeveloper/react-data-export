# Releasing

**Pull request → merge to `main` → publish to npm.** Merging is the approval. A release is just a pull request that changes the package version. When it merges, `.github/workflows/release.yml` publishes that version to npm with trusted publishing (OIDC, no npm token, provenance attached automatically). Then it creates the `v<version>` tag and a GitHub Release.

The published package is `packages/react-data-export`. The playground (`apps/playground`) and the workspace root are private and never published. The root `CHANGELOG.md` is the 0.x history; 1.0 release notes go to `packages/react-data-export/CHANGELOG.md`.

## 1. Add a changeset to your pull request

Every pull request that changes the published package adds a changeset:

```sh
npx changeset
```

Pick `react-data-export`, choose the bump (patch, minor, major) and write one line for the changelog. This creates a small Markdown file in `.changeset/`; commit it with your change. Pull requests that only touch docs, CI or the playground need no changeset.

Merging a pull request with only a changeset publishes nothing. The version doesn't change until a release pull request.

## 2. Cut a release pull request

When a release makes sense (Afzal or the team lead decides):

```sh
git switch -c release-<version> origin/main
npm run version-packages     # changeset version + version constant + lockfile sync
git diff                     # review the version bump and CHANGELOG.md
```

`npm run version-packages` runs `changeset version`, which:
- consumes the pending changesets,
- bumps `packages/react-data-export/package.json`,
- writes `packages/react-data-export/CHANGELOG.md`,
- updates the playground's dependency on the package.

It then runs `scripts/sync-version.mjs`, which sets the `version` constant in `packages/react-data-export/src/index.ts` to the new version (`changeset version` never edits source files). It fails if it can't find exactly one such constant, so renaming the constant can't silently break the sync.

Finally it runs `npm install --package-lock-only`. Without that step, `package-lock.json` would still list the old version, and `npm ci` (in CI and in the release job) would fail.

Open the pull request. Its **Release dry run** CI job shows what merging would do. The "Release preview" step says which version would be published, or "no release". The job also runs `npm publish --dry-run` with the dist-tag that would be used.

## 3. Prereleases (pre mode)

1.0 starts out as prereleases on the `next` dist-tag, so `npm install react-data-export` keeps getting 0.6.0 (`latest`) until 1.0.0 is final.

```sh
npx changeset pre enter alpha     # or beta / rc; commit .changeset/pre.json
npm run version-packages          # 1.0.0-alpha.1, 1.0.0-alpha.2, ...
npx changeset pre exit            # when the final 1.0.0 is next
npm run version-packages          # 1.0.0
```

Any version with a prerelease part (`-alpha.1`, `-beta.0`, ...) is published with `--tag next` and marked as a prerelease on GitHub. A plain version (`1.0.0`) goes to `latest`.

## 4. What happens on merge

On every push to `main`, the `Release` job (environment `npm`, `main` only) runs `scripts/release-check.mjs`. It publishes only if **both** hold:

1. the package version differs from the previous commit (`HEAD~1`), and
2. `react-data-export@<version>` is not on npm yet.

Otherwise it stops with "no release" in the job summary. That covers docs and feature merges, re-runs after a successful publish, and the current `1.0.0-alpha.0` (never published, and the version hasn't changed).

For a release, the job then:
1. runs `npm ci`, sets up openpyxl (part of the shared `release.yml`; this package's tests don't need it, but the step is kept so the file stays identical across the four repositories), then `npm run typecheck`, `npm test` and `npm run build`,
2. runs `npm publish ./packages/react-data-export --tag next|latest`,
3. runs `gh release create v<version>`, which creates the tag on the merge commit. The notes are that version's section of `CHANGELOG.md`.

The job also checks that npm is at least 11.5.1, which trusted publishing requires. Node 24 ships a newer npm.

Re-running the job is safe:
- After a failed publish, the version is still unpublished, so the re-run publishes.
- After a successful publish but a failed tag/Release step, the re-run skips publishing and creates the missing tag and Release.
- If everything already succeeded, the re-run does nothing.

### Recovery: run the release by hand

A re-run repeats the original push, so it can't help when the version is no longer "new" relative to `HEAD~1`. For example, the release job failed before publishing, and a fix for the job itself was merged afterwards. For that case, `release.yml` can also be started manually:

```sh
gh workflow run release.yml --ref main
```

(or Actions → Release → Run workflow, branch `main`.)

A manual run publishes the current version of `main` **if it is not on npm yet**, even when it did not change in the last commit. If it is already on npm, nothing is published, and the run only creates the `v<version>` tag and GitHub Release if they are missing. npm errors other than "not found" still fail the job, as on a push. The run is limited to `main`, both by the job's `if` and by the `npm` environment's branch policy.

Trusted publishing checks the **workflow file name** (`release.yml`) and the environment (`npm`), not the event that started it. A manual run is the same file in the same environment, so it publishes exactly like a push. The tag and Release point at the commit that was built: the tip of `main` when the run started.

## 5. First release: one-time setup (Afzal)

Trusted publishing is configured on npmjs.com, not in this repository. **Do it on the same day as the first release merge**, because npm expires a trusted publisher config that goes unused for 2 days, and it doesn't validate the fields when you save.

1. npmjs.com → `react-data-export` → Settings → **Trusted publishing** → GitHub Actions:
   - Organization or user: `securedeveloper`
   - Repository: `react-data-export`
   - Workflow filename: `release.yml`
   - Environment: `npm`
2. Merge the release pull request and check that the `Release` job published.
3. Then, under package Settings → Publishing access, choose **Require two-factor authentication and disallow tokens**. Trusted publishing keeps working; tokens stop working.

The `npm` GitHub environment already exists and is limited to `main`. Error `ENEEDAUTH` or `E403` on publish usually means one of the four fields doesn't match exactly (it's case-sensitive).
