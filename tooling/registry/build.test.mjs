import assert from "node:assert/strict";
import test from "node:test";
import { contentDigest } from "./contracts.mjs";

test("contentDigest is stable across input order", () => {
  const first = contentDigest([
    { path: "components/Button/index.ts", content: "export { Button }" },
    { path: "components/Button/meta.json", content: "{}" },
  ]);
  const second = contentDigest([
    { path: "components/Button/meta.json", content: "{}" },
    { path: "components/Button/index.ts", content: "export { Button }" },
  ]);
  assert.equal(first, second);
});

test("contentDigest changes when source content changes", () => {
  const before = contentDigest([{ path: "components/Button/index.ts", content: "before" }]);
  const after = contentDigest([{ path: "components/Button/index.ts", content: "after" }]);
  assert.notEqual(before, after);
});
