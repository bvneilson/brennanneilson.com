import { expect, test } from "vitest";

// Rendering is covered in home.test.tsx. This pins the page modules: a component each, and an
// hourly revalidate so cards hide at request time, not at build time (spec §7.4).
test("home page module exports a component and revalidates hourly", async () => {
  const mod = await import("../src/app/page.tsx");
  expect(typeof mod.default).toBe("function");
  expect(mod.revalidate).toBe(3600);
});

test("/verified page module exports a component and revalidates hourly", async () => {
  const mod = await import("../src/app/verified/page.tsx");
  expect(typeof mod.default).toBe("function");
  expect(mod.revalidate).toBe(3600);
});

// R29: pages and their imports stay pure. truth/ holds the walk CLI, which pulls node:fs.
test("nothing under src/ imports truth/ or a node: builtin", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const dir = new URL("../src/", import.meta.url).pathname;
  const files = readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => /\.tsx?$/.test(f));
  expect(files.length).toBeGreaterThan(10);
  for (const f of files) {
    const src = readFileSync(join(dir, f), "utf8");
    expect(src, f).not.toMatch(/from\s+['"](?:[./]*\/)?truth\//);
    expect(src, f).not.toMatch(/from\s+['"]node:/);
  }
});
