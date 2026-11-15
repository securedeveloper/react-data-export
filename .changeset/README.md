# Changesets

Each pull request that changes the published package adds one changeset:

```sh
npx changeset
```

Pick the bump (patch, minor or major) and write one line for the changelog. Docs- and CI-only pull requests need none. See [RELEASING.md](../RELEASING.md) for how a release is cut and published.
