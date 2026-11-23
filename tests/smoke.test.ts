import { expect, test } from "vitest";

// Rendering is covered in home.test.tsx. This pins the page modules: a component each, rendered
// per request with no ISR window, so a failed walk hides its card on the next view (spec §7.4, R32).
test("home page module exports a component and renders per request", async () => {
  const mod = (await import("../src/app/page.tsx")) as Record<string, unknown>;
  expect(typeof mod.default).toBe("function");
  expect(mod.dynamic).toBe("force-dynamic");
  expect(mod.revalidate).toBeUndefined();
});

test("/verified page module exports a component and renders per request", async () => {
  const mod = (await import("../src/app/verified/page.tsx")) as Record<string, unknown>;
  expect(typeof mod.default).toBe("function");
  expect(mod.dynamic).toBe("force-dynamic");
  expect(mod.revalidate).toBeUndefined();
});

test("/coo page module exports a component and renders per request", async () => {
  const mod = (await import("../src/app/coo/page.tsx")) as Record<string, unknown>;
  expect(typeof mod.default).toBe("function");
  expect(mod.dynamic).toBe("force-dynamic");
  expect(mod.revalidate).toBeUndefined();
});

// Per request too: the resume hides itself 120 days after its last review, with no rebuild.
test("/resume page module exports a component and renders per request", async () => {
  const mod = (await import("../src/app/resume/page.tsx")) as Record<string, unknown>;
  expect(typeof mod.default).toBe("function");
  expect(mod.dynamic).toBe("force-dynamic");
  expect(mod.revalidate).toBeUndefined();
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
