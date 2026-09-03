import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

test("deployed proxy runs without workspace packages or a TypeScript loader", () => {
  const directory = mkdtempSync(join(tmpdir(), "yami-proxy-bundle-"));
  const app = join(directory, "apps/storybook");
  const entrypoint = join(app, "dist/proxy.js");
  try {
    mkdirSync(join(app, "dist"), { recursive: true });
    writeFileSync(join(app, "package.json"), '{"type":"module"}');
    copyFileSync("dist/proxy.js", entrypoint);
    for (const asset of ["generated/tokens.css", "assets/fonts/GT-Walsheim-Regular.woff2"]) {
      const target = join(directory, "packages/design-system", asset);
      mkdirSync(join(target, ".."), { recursive: true });
      copyFileSync(join("../../packages/design-system", asset), target);
    }
    execFileSync(process.execPath, ["--input-type=module", "-e", `
      import assert from "node:assert/strict";
      const { default: proxy } = await import(${JSON.stringify(pathToFileURL(entrypoint).href)});
      const origin = "https://storybook.example.com";
      const request = (path, init) => proxy(new Request(origin + path, init));
      assert.equal((await request("/index.json")).status, 401);
      const page = await request("/__access/login?lang=zh");
      assert.equal(page.status, 200);
      assert.match(await page.text(), /YAMI Storybook/);
      const login = await request("/__access/login", {
        method: "POST",
        headers: { origin, "content-type": "application/x-www-form-urlencoded" },
        body: "password=bundle-test-password",
      });
      assert.equal(login.status, 303);
      const cookie = login.headers.get("set-cookie").split(";")[0];
      const allowed = await request("/index.json", { headers: { cookie } });
      assert.equal(allowed.headers.get("x-middleware-next"), "1");
      assert.match(allowed.headers.get("cache-control"), /no-store/);
    `], {
      cwd: directory,
      env: { ...process.env, NODE_ENV: "production", VERCEL: "1",
        YAMI_SITE_PASSWORD: "bundle-test-password", YAMI_SESSION_SECRET: "bundle-test-secret-".repeat(4) },
      stdio: "pipe",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
