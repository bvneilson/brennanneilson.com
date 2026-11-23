import { expect, test } from "vitest";

test("home page module exports a component", async () => {
  expect(typeof (await import("../src/app/page.tsx")).default).toBe("function");
});

test("home page renders the name inside an otherwise empty main", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const Page = (await import("../src/app/page.tsx")).default;
  expect(renderToStaticMarkup(createElement(Page))).toBe(
    "<main><h1>Brennan Neilson</h1></main>",
  );
});
