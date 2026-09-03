import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { sealData } from "iron-session";
import { createSiteAccess, type Site } from "../src/index";

const origin = "https://preview.example.com";
const password = "test-only-shared-password";
const secret = "test-only-session-secret-at-least-32-characters";
const request = (path: string, init?: RequestInit) => new Request(origin + path, init);
const login = (value = password, query = "", headers: Record<string, string> = {}) => request(`/__access/login${query}`, {
  method: "POST", headers: { origin, "content-type": "application/x-www-form-urlencoded", ...headers },
  body: new URLSearchParams({ password: value }),
});
const cookieFrom = (result: Response) => result.headers.get("set-cookie")!.split(";")[0];

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("YAMI_SITE_PASSWORD", password);
  vi.stubEnv("YAMI_SESSION_SECRET", secret);
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe.each<Site>(["docsite", "storybook"])("%s access boundary", (site) => {
  it.each(["/zh", "/en/docs/faq", "/api/search", "/zh/yami-skill.md", "/yami-skill.md", "/iframe.html?id=button--showcase", "/index.json", "/assets/story.js", "/_next/static/chunks/app.js", "/zh?_rsc=123", "/email/topic-landing"])("blocks direct access to %s", async (path) => {
    const result = await createSiteAccess(site)(request(path));
    expect(result?.status).toBe(401);
    expect(await result?.text()).toBe("");
    expect(result?.headers.get("cache-control")).toContain("no-store");
  });

  it("redirects browser navigation to a localized login and returns to the original page", async () => {
    const gate = createSiteAccess(site);
    const blocked = await gate(request("/en/docs/faq?from=nav", { headers: { accept: "text/html" } }));
    expect(blocked?.status).toBe(303);
    const location = new URL(blocked!.headers.get("location")!);
    expect(location.searchParams.get("next")).toBe("/en/docs/faq?from=nav");
    expect(location.searchParams.get("lang")).toBe("en");
    const loggedIn = await gate(login(password, location.search));
    expect(loggedIn?.headers.get("location")).toBe(origin + "/en/docs/faq?from=nav");
    expect(loggedIn?.headers.get("set-cookie")).toContain(`__Host-yami-${site}-access=`);
    expect(loggedIn?.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Lax; Max-Age=604800; Secure/);
    expect(loggedIn?.headers.get("set-cookie")).not.toContain(password);
    const cookie = cookieFrom(loggedIn!);
    for (const path of ["/zh", "/api/search", "/zh/yami-skill.md", "/iframe.html", "/index.json", "/assets/story.js"]) {
      expect(await gate(request(path, { headers: { cookie } }))).toBeNull();
    }
  });

  it("renders both languages without loading protected scripts or echoing the password", async () => {
    const gate = createSiteAccess(site);
    const zh = await gate(request("/__access/login?next=/en&lang=zh"));
    expect(await zh?.text()).toContain(site === "docsite" ? "YAMI 设计系统" : "YAMI Storybook");
    const en = await gate(request("/__access/login?lang=en"));
    const html = await en?.text();
    expect(html).toContain(site === "docsite" ? "YAMI Design System" : "YAMI Storybook");
    expect(html).not.toMatch(/<script\s+src=/);
    expect(html?.match(/<script>/g)).toHaveLength(1);
    const script = html!.match(/<script>([\s\S]*?)<\/script>/)![1];
    expect(en?.headers.get("content-security-policy")).toContain(`'sha256-${createHash("sha256").update(script).digest("base64")}'`);
    expect(en?.headers.get("content-security-policy")).toContain("script-src 'sha256-");
    expect(en?.headers.get("content-security-policy")).not.toContain("script-src 'unsafe-inline'");
    expect(html).not.toContain(password);
    expect(en?.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    const invalid = await gate(login("invalid-password"));
    expect(invalid?.status).toBe(401);
    expect(await invalid?.text()).toContain("密码不正确");
    expect(invalid?.headers.has("set-cookie")).toBe(false);
  });

  it("invalidates existing sessions immediately when the password changes", async () => {
    const gate = createSiteAccess(site);
    const cookie = cookieFrom((await gate(login()))!);
    vi.stubEnv("YAMI_SITE_PASSWORD", "replacement-password-for-the-team");
    expect((await gate(request("/index.json", { headers: { cookie } })))?.status).toBe(401);
  });

  it("rejects expired, tampered, wrong-site and wrong-origin cookies", async () => {
    const gate = createSiteAccess(site);
    const good = cookieFrom((await gate(login()))!);
    expect((await gate(request("/", { headers: { cookie: good.replace("*", "*tampered") } })))?.status).toBe(401);
    const base = { site, origin, version: createHmac("sha256", secret).update(password).digest("hex"), expires: Date.now() + 60_000 };
    for (const payload of [{ ...base, expires: Date.now() - 1 }, { ...base, site: "another-app" }, { ...base, origin: "https://other.example.com" }]) {
      const seal = await sealData(payload, { password: secret, ttl: 604800 });
      expect((await gate(request("/", { headers: { cookie: `__Host-yami-${site}-access=${seal}` } })))?.status).toBe(401);
    }
  });

  it("requires same-origin POST for login/logout and clears the session on logout", async () => {
    const gate = createSiteAccess(site);
    expect((await gate(login(password, "", { origin: "https://attacker.example" })))?.status).toBe(403);
    expect((await gate(request("/__access/login", { method: "POST" })))?.status).toBe(403);
    expect((await gate(request("/__access/login", { method: "PUT" })))?.status).toBe(405);
    const cookie = cookieFrom((await gate(login()))!);
    const form = await gate(request("/__access/logout", { headers: { cookie } }));
    expect(form?.headers.has("set-cookie")).toBe(false);
    expect(await form?.text()).toContain("退出访问");
    const logout = await gate(request("/__access/logout", { method: "POST", headers: { origin, cookie } }));
    expect(logout?.status).toBe(303);
    expect(logout?.headers.get("set-cookie")).toContain("Max-Age=0");
    expect((await gate(request("/")))?.status).toBe(401);
  });

  it("uses the browser-facing Host when Next normalizes its internal URL", async () => {
    const gate = createSiteAccess(site);
    const result = await gate(new Request("https://localhost/__access/login", {
      method: "POST", headers: { host: "preview.example.com", origin, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ password }),
    }));
    expect(result?.status).toBe(303);
    expect(result?.headers.get("location")).toBe(origin + "/");
    expect((await gate(login(password, "", { "x-forwarded-host": "attacker.example", origin: "https://attacker.example" })))?.status).toBe(403);
  });

  it.each(["//evil.example", "/\\evil.example", "https://evil.example", "/__access/logout", "/a/../__access/login"])("prevents redirect abuse via %s", async (target) => {
    const result = await createSiteAccess(site)(login(password, `?next=${encodeURIComponent(target)}`));
    expect(result?.headers.get("location")).toBe(origin + "/");
  });

  it("escapes markup in return URLs", async () => {
    const result = await createSiteAccess(site)(request(`/__access/login?next=${encodeURIComponent('/?x="/><script>alert(1)</script>')}`));
    const html = await result?.text();
    expect(html?.match(/<script>/g)).toHaveLength(1);
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("limits attempts and bounds request size", async () => {
    const gate = createSiteAccess(site);
    for (let i = 0; i < 8; i++) expect((await gate(login("wrong")))?.status).toBe(401);
    const limited = await gate(login());
    expect(limited?.status).toBe(429);
    expect(Number(limited?.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await createSiteAccess(site)(login("x".repeat(5000))))?.status).toBe(400);
  });

  it("accepts an eight-character password", async () => {
    vi.stubEnv("YAMI_SITE_PASSWORD", "12345678");
    expect((await createSiteAccess(site)(login("12345678")))?.status).toBe(303);
  });

  it.each([undefined, "", "short", "1234567"])("fails closed if the access password is %s", async (value) => {
    vi.stubEnv("YAMI_SITE_PASSWORD", value);
    const result = await createSiteAccess(site)(request("/index.json"));
    expect(result?.status).toBe(503);
    expect(await result?.text()).not.toContain(secret);
  });

  it("fails closed with a missing secret, even during partial local setup", async () => {
    vi.stubEnv("YAMI_SESSION_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    expect((await createSiteAccess(site)(request("/")))?.status).toBe(503);
  });

  it("only leaves unconfigured local development open", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("YAMI_SITE_PASSWORD", "");
    vi.stubEnv("YAMI_SESSION_SECRET", "");
    expect(await createSiteAccess(site)(request("/"))).toBeNull();
    vi.stubEnv("VERCEL", "1");
    expect((await createSiteAccess(site)(request("/")))?.status).toBe(503);
  });
});
