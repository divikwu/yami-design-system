import { createHash } from "node:crypto";

import { sha256Digest } from "../product-selection/digest.js";

export function sha256Bytes(bytes: Uint8Array) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function withoutDigest<T extends object>(value: T) {
  const bound = { ...value } as T & { digest?: string };
  delete bound.digest;
  return bound;
}

export function topicPageAssetManifestDigest<T extends object>(manifest: T) {
  return sha256Digest(withoutDigest(manifest));
}

export function topicPageGenerationSpecDigest<T extends object>(spec: T) {
  return sha256Digest(withoutDigest(spec));
}

export function topicPageQaReportDigest<T extends object>(report: T) {
  return sha256Digest(withoutDigest(report));
}
