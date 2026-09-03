import { request } from "@playwright/test";
import { mkdir } from "node:fs/promises";

export default async function setupProductionAccess() {
  if (process.env.PLAYWRIGHT_USE_PRODUCTION !== "1" && process.env.PLAYWRIGHT_USE_EXISTING_BUILD !== "1") return;
  const origin = "http://127.0.0.1:3400";
  const context = await request.newContext();
  try {
    const result = await context.post(`${origin}/__access/login`, {
      form: { password: "yami-local-preview-only" },
      headers: { origin }, maxRedirects: 0,
    });
    if (result.status() !== 303) throw new Error(`Production test login failed (${result.status()})`);
    await mkdir("test-results/.auth", { recursive: true });
    await context.storageState({ path: "test-results/.auth/docsite.json" });
  } finally {
    await context.dispose();
  }
}
