import { createHmac, timingSafeEqual } from "node:crypto";
import { sealData, unsealData } from "iron-session";
import { accessPage, themeScriptHash } from "./page";

export type Site = "docsite" | "storybook";
const LOGIN = "/__access/login";
const LOGOUT = "/__access/logout";
const TTL = 7 * 24 * 60 * 60;
const MAX_BODY = 4096;

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function response(body: string | null, status: number, extra: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      ...privateHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "Content-Security-Policy": `default-src 'none'; script-src 'sha256-${themeScriptHash}'; style-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
      ...extra,
    },
  });
}

function safeReturn(value: string | null, origin: string) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/";
  const target = new URL(value, origin);
  if (target.origin !== origin || target.pathname.startsWith("/__access")) return "/";
  return target.pathname + target.search + target.hash;
}

async function readForm(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/x-www-form-urlencoded") return null;
  if (Number(request.headers.get("content-length")) > MAX_BODY) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

/** Per-instance backstop only. Production must also rate-limit login at the edge. */
function attemptLimiter() {
  const buckets = new Map<string, { count: number; until: number }>();
  return (key: string) => {
    const now = Date.now();
    for (const [id, bucket] of buckets) if (bucket.until <= now) buckets.delete(id);
    const bucket = buckets.get(key);
    if (bucket && bucket.count >= 8) return Math.ceil((bucket.until - now) / 1000);
    if (!bucket && buckets.size >= 2000) return 60;
    buckets.set(key, { count: (bucket?.count ?? 0) + 1, until: bucket?.until ?? now + 60_000 });
    return 0;
  };
}

/** Same gate for Next.js and Vercel's static Storybook host. Null means continue. */
export function createSiteAccess(site: Site) {
  const limit = attemptLimiter();
  return async (request: Request): Promise<Response | null> => {
    const password = process.env.YAMI_SITE_PASSWORD;
    const secret = process.env.YAMI_SESSION_SECRET;
    // Only an unconfigured local development server is open by default.
    if (process.env.NODE_ENV === "development" && !process.env.VERCEL && !password && !secret) return null;

    const url = new URL(request.url);
    // Next's internal URL can use localhost; the browser submits to the actual
    // Host. Never use x-forwarded-host or the submitted Origin as the authority.
    if (request.headers.get("host")) url.host = request.headers.get("host")!;
    const returnTo = safeReturn(url.searchParams.get("next"), url.origin);
    const localePath = url.pathname.startsWith("/__access/") ? returnTo : url.pathname;
    const requestedLang = url.searchParams.get("lang");
    const lang = requestedLang === "zh" || requestedLang === "en" ? requestedLang : /^\/en(?:\/|$)/.test(localePath) ? "en" : "zh";
    const page = (message: "invalid" | "limited" | "unavailable" | "logout" | undefined = undefined) =>
      accessPage({ site, lang, returnTo, message });

    if (!password || password.length < 8 || !secret || secret.length < 32) {
      return response(page("unavailable"), 503);
    }
    const digest = (value: string) => createHmac("sha256", secret).update(value).digest();
    const version = digest(password).toString("hex");
    const secure = url.protocol === "https:";
    if (!secure && process.env.VERCEL) return response(page("unavailable"), 503);
    const cookieName = `${secure ? "__Host-" : ""}yami-${site}-access`;
    const cookie = (value: string, age: number) =>
      `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? "; Secure" : ""}`;
    const seal = request.headers.get("cookie")?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    let authenticated = false;
    if (seal && seal.length < MAX_BODY) {
      try {
        const session = await unsealData<{ site: string; origin: string; version: string; expires: number }>(seal, { password: secret, ttl: TTL });
        authenticated = session.site === site && session.origin === url.origin && session.version === version
          && typeof session.expires === "number" && session.expires > Date.now();
      } catch {
        // An unreadable or forged session is treated as signed out.
      }
    }

    const redirect = (target: string, headers: Record<string, string> = {}) =>
      response(null, 303, { Location: new URL(target, url.origin).href, ...headers });
    const loginLink = (next: string) => `${LOGIN}?${new URLSearchParams({ next, lang })}`;

    if (url.pathname === LOGIN || url.pathname === LOGOUT) {
      if (request.method === "GET" || request.method === "HEAD") {
        if (url.pathname === LOGOUT && !authenticated) return redirect(loginLink(returnTo));
        if (url.pathname === LOGIN && authenticated) return redirect(returnTo);
        return response(request.method === "HEAD" ? null : page(url.pathname === LOGOUT ? "logout" : undefined), 200);
      }
      if (request.method !== "POST") return response(null, 405, { Allow: "GET, HEAD, POST" });
      // Browser form submissions send Origin. Do not trust Referer or forwarded origins.
      if (request.headers.get("origin") !== url.origin) return response(null, 403);
      if (url.pathname === LOGOUT) return redirect(loginLink(returnTo), { "Set-Cookie": cookie("", 0), "Clear-Site-Data": '"cache"' });

      // Vercel overwrites x-forwarded-for. Never trust arbitrary proxy headers locally.
      const ip = process.env.VERCEL ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown" : "local";
      const retry = limit(ip);
      if (retry) return response(page("limited"), 429, { "Retry-After": String(retry) });
      let form: URLSearchParams | null;
      try { form = await readForm(request); } catch { form = null; }
      if (!form) return response(page("invalid"), 400);
      const supplied = form.get("password") ?? "";
      if (!timingSafeEqual(digest(supplied), digest(password))) return response(page("invalid"), 401);
      const token = await sealData({ site, origin: url.origin, version, expires: Date.now() + TTL * 1000 }, { password: secret, ttl: TTL });
      return redirect(returnTo, { "Set-Cookie": cookie(token, TTL) });
    }

    if (authenticated) return null;
    if ((request.method === "GET" || request.method === "HEAD") && request.headers.get("accept")?.includes("text/html")) {
      return redirect(loginLink(url.pathname + url.search));
    }
    // Do not return login HTML to APIs, React Server Components or static assets.
    return response(null, 401);
  };
}
