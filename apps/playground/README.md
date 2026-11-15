# playground

Minimal Vite + React 19 app that imports the workspace `react-data-export` package (aliased to its source in `vite.config.ts`). It will grow into the dataset/table export demo.

```sh
# from the repo root
npm ci
npm run dev -w playground      # http://localhost:5173
npm run build -w playground    # -> apps/playground/dist
```

## Vercel (not set up yet)

When the Vercel project is created:

| setting | value |
|---|---|
| Root Directory | `apps/playground` |
| Framework Preset | Vite |
| Install Command | `npm ci` (Vercel detects the workspace lockfile at the repo root) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 24.x |

"Include files outside the root directory in the Build Step" must stay enabled (the default), because the app imports `../../packages/react-data-export/src`.
