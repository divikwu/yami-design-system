import { createHash } from "node:crypto";

export function contentDigest(entries) {
  const hash = createHash("sha256");
  for (const entry of [...entries].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(entry.path);
    hash.update("\0");
    hash.update(entry.content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function collectReferenceIds(value, property, ids = []) {
  if (Array.isArray(value)) for (const item of value) collectReferenceIds(item, property, ids);
  else if (value && typeof value === "object") {
    if (typeof value[property] === "string") ids.push(value[property]);
    for (const child of Object.values(value)) collectReferenceIds(child, property, ids);
  }
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}
