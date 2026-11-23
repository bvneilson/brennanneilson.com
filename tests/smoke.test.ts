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
