import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { loadEnv } from "vite";
import proxy from "../proxy";

// Local verification of the same proxy used by Vercel; never expose the raw
// Storybook static directory on a separate public server.
for (const [key, value] of Object.entries(loadEnv("production", process.cwd(), "YAMI_"))) {
  process.env[key] ??= value;
}
const root = path.resolve("storybook-static");
const port = Number(process.env.PORT ?? 6007);
if (!existsSync(path.join(root, "index.html"))) throw new Error("Build Storybook before running preview:protected.");
const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".gif": "image/gif", ".woff2": "font/woff2", ".woff": "font/woff",
};

createServer(async (req, res) => {
  try {
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(req.headers.host ?? "")) {
      res.writeHead(400).end();
      return;
    }
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
    const init: RequestInit & { duplex?: "half" } = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = Readable.toWeb(req) as ReadableStream<Uint8Array>;
      init.duplex = "half";
    }
    const result = await proxy(new Request(url, init));
    result.headers.forEach((value, key) => { if (key !== "x-middleware-next") res.setHeader(key, value); });
    if (result.headers.get("x-middleware-next") !== "1") {
      res.writeHead(result.status).end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405).end(); return; }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    if (pathname === "/email/topic-landing") pathname = "/email/topic-landing/index.html";
    const file = await realpath(path.resolve(root, `.${pathname}`));
    if (!file.startsWith(root + path.sep) || !(await stat(file)).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", contentTypes[path.extname(file)] ?? "application/octet-stream");
    res.writeHead(200);
    if (req.method === "HEAD") res.end();
    else createReadStream(file).pipe(res);
  } catch (error) {
    if (!res.headersSent) res.writeHead((error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500);
    res.end();
  }
}).listen(port, "127.0.0.1", () => console.log(`Protected Storybook preview: http://127.0.0.1:${port}`));
