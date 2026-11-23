import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: {
    rules: {
      // `import source from './resume.md?raw'` bundles the file's text into the server code, so the
      // pages read src/content/resume.md without node:fs (R29). Vitest handles `?raw` natively.
      "*.md": { condition: { query: "?raw" }, type: "raw" },
    },
  },
};

export default config;
