import { DirectionManifestV1Schema, type DirectionManifestV1 } from "@yami/contracts";

export const DRAFTS_KEY = "yami-design-system:drafts:v1";
export const DRAFTS_CHANGED_EVENT = "yami-design-system:drafts-changed";
const LEGACY_DRAFTS_KEY = "yami-canvas:drafts:v1";

export function readDrafts(): DirectionManifestV1[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(DRAFTS_KEY);
    const legacy = stored === null ? localStorage.getItem(LEGACY_DRAFTS_KEY) : null;
    const raw = JSON.parse(stored ?? legacy ?? "[]");
    const drafts = Array.isArray(raw) ? raw.map((item) => DirectionManifestV1Schema.safeParse(item)).filter((result) => result.success).map((result) => result.data) : [];
    if (stored === null && legacy !== null) {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      localStorage.removeItem(LEGACY_DRAFTS_KEY);
    }
    return drafts;
  } catch { return []; }
}

export function writeDrafts(drafts: DirectionManifestV1[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  window.dispatchEvent(new CustomEvent(DRAFTS_CHANGED_EVENT));
}

export function upsertDraft(draft: DirectionManifestV1) {
  const drafts = readDrafts().filter((item) => item.id !== draft.id);
  writeDrafts([draft, ...drafts]);
}

export function findDraft(id: string): DirectionManifestV1 | null {
  return readDrafts().find((draft) => draft.id === id) ?? null;
}
