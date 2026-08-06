export type Navigate = (path: string) => void;

export function normalizePrototypePath(href: string): string {
  if (href.startsWith("/")) return href;
  const slug = href.replace(/^#/, "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  if (slug.includes("cart")) return "/cart";
  if (slug.includes("search")) return `/search/${slug}`;
  if (slug.includes("brand")) return `/brands/${slug}`;
  if (slug.includes("product")) return `/products/${slug}`;
  return `/categories/${slug || "all"}`;
}

export function bindNavigation<T>(value: T, navigate: Navigate): T {
  if (Array.isArray(value)) return value.map((item) => bindNavigation(item, navigate)) as T;
  if (!value || typeof value !== "object" || isValidElement(value)) return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === "href" && typeof item === "string") {
      output.href = normalizePrototypePath(item);
      output.onClick = (event: { preventDefault(): void }) => { event.preventDefault(); navigate(normalizePrototypePath(item)); };
    } else if (typeof item !== "function") output[key] = bindNavigation(item, navigate);
  }
  return output as T;
}
import { isValidElement } from "react";
