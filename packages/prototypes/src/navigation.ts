export type Navigate = (path: string) => void;

export function normalizePrototypePath(href: string): string {
  let candidate = href.trim();
  if (/^https?:\/\//i.test(candidate)) {
    const url = new URL(candidate);
    candidate = url.pathname;
  }

  const hashSlug = candidate.startsWith("#") ? candidate.slice(1) : null;
  if (hashSlug !== null) {
    const slug = slugify(hashSlug);
    if (!slug || slug === "home") return "/";
    if (slug === "account") return "/account";
    if (slug.includes("cart")) return "/cart";
    if (slug.includes("search")) return `/search/${slug}`;
    if (slug.includes("brand")) return `/brands/${slug}`;
    if (slug.includes("product")) return `/products/${slug}`;
    return `/categories/${slug}`;
  }

  const segments = candidate.split(/[?#]/, 1)[0].split("/").filter(Boolean);
  if (segments[0] === "us") segments.shift();
  if (segments[0] === "zh" || segments[0] === "en") segments.shift();
  const [root, ...rest] = segments;
  const last = slugify(rest.at(-1) ?? root ?? "");
  if (!root || root === "home") return "/";
  if (root === "account") return "/account";
  if (root === "cart") return "/cart";
  if (root === "search") return `/search/${last || "all"}`;
  if (root === "b" || root === "brand" || root === "brands") return `/brands/${last || "all"}`;
  if (root === "p" || root === "item" || root === "product" || root === "products") return `/products/${last || "all"}`;
  if (root === "categories" || root === "category") return `/categories/${last || "all"}`;
  return `/categories/${slugify(segments.join("-")) || "all"}`;
}

function slugify(value: string): string {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export function bindNavigation<T>(value: T, navigate: Navigate): T {
  if (Array.isArray(value)) return value.map((item) => bindNavigation(item, navigate)) as T;
  if (!value || typeof value !== "object" || isValidElement(value)) return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if ((key === "href" || key.endsWith("Href")) && typeof item === "string") {
      output[key] = normalizePrototypePath(item);
    } else if (key === "onAddToCart" && typeof item === "function") {
      output[key] = () => navigate("/cart");
    } else if (typeof item !== "function") output[key] = bindNavigation(item, navigate);
  }
  return output as T;
}
import { isValidElement } from "react";
