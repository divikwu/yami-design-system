import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { isRepositoryPath, routeMatchesSource } from "./contracts.mjs";

test("route path must match its App Router page source", () => {
  assert.equal(routeMatchesSource("/preview?path=%2F", "apps/canvas/app/preview/page.tsx"), true);
  assert.equal(routeMatchesSource("/preview/search", "apps/canvas/app/preview/search/page.tsx"), true);
  assert.equal(routeMatchesSource("/does-not-exist", "apps/canvas/app/preview/page.tsx"), false);
  assert.equal(routeMatchesSource("/preview", "packages/prototypes/pages/EcommerceHome/page.tsx"), false);
});

test("repository references cannot escape the repository root", () => {
  const root = path.resolve("/tmp/yami-page-contract");
  assert.equal(isRepositoryPath(root, "packages/prototypes/pages/EcommerceHome"), true);
  assert.equal(isRepositoryPath(root, "../outside"), false);
  assert.equal(isRepositoryPath(root, "/tmp/outside"), false);
});
