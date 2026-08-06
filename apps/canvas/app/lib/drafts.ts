import { DirectionManifestV1Schema, type DirectionManifestV1 } from "@yami/contracts";

export const DRAFTS_KEY = "yami-canvas:drafts:v1";

export function readDrafts(): DirectionManifestV1[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.map((item) => DirectionManifestV1Schema.safeParse(item)).filter((result) => result.success).map((result) => result.data) : [];
  } catch { return []; }
}

export function writeDrafts(drafts: DirectionManifestV1[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  window.dispatchEvent(new CustomEvent("yami-canvas:drafts-changed"));
}

export function upsertDraft(draft: DirectionManifestV1) {
  const drafts = readDrafts().filter((item) => item.id !== draft.id);
  writeDrafts([draft, ...drafts]);
}

export function findDraft(id: string): DirectionManifestV1 | null {
  return readDrafts().find((draft) => draft.id === id) ?? null;
}
