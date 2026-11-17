// One production build per entry (ENTRY=baseline|dataset|table|all|v0.6), so
// each output is exactly what that app ships. scripts/bundlers.mjs compares
// them with the baseline (React alone).
const entry = process.env.ENTRY ?? "baseline";

export default {
  logLevel: "warn",
  build: {
    outDir: `dist/${entry}`,
    emptyOutDir: true,
    rollupOptions: { input: `src/${entry}.jsx` },
  },
};
