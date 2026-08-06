import { CompleteHomeSectionPropsSchemas, type DirectionManifestV1, type HomeSectionPatch } from "@yami/contracts";
import type { EcommerceHomeProps, EcommerceHomeSection } from "../pages/EcommerceHome";
import { createEcommerceHomeFixture, type EcommerceHomeLocale } from "../pages/EcommerceHome";
import { bindNavigation, type Navigate } from "./navigation";

function mergeSection(section: EcommerceHomeSection, patch: HomeSectionPatch): EcommerceHomeSection {
  if (section.kind !== patch.kind) throw new Error(`Section ${section.id} cannot change kind`);
  return { ...section, props: { ...section.props, ...(patch.props ?? {}) } } as EcommerceHomeSection;
}

function createSection(patch: HomeSectionPatch): EcommerceHomeSection {
  if (!patch.props) throw new Error(`New section ${patch.id} requires complete props`);
  const schema = CompleteHomeSectionPropsSchemas[patch.kind];
  const props = schema.parse(patch.props);
  return { id: patch.id, kind: patch.kind, props } as EcommerceHomeSection;
}

export function resolveEcommerceHome(locale: EcommerceHomeLocale, manifest: DirectionManifestV1 | null, navigate: Navigate): EcommerceHomeProps {
  const current = createEcommerceHomeFixture(locale);
  const overlay = manifest?.pages.home;
  if (!overlay) return bindNavigation(current, navigate);

  const patchIds = (overlay.sections ?? []).map((patch) => patch.id);
  if (new Set(patchIds).size !== patchIds.length) throw new Error("Section patch IDs must be unique");
  const patches = new Map((overlay.sections ?? []).map((patch) => [patch.id, patch]));
  const hidden = new Set((overlay.sections ?? []).filter((patch) => patch.hidden).map((patch) => patch.id));
  let sections = current.sections.map((section) => patches.has(section.id) ? mergeSection(section, patches.get(section.id)!) : section).filter((section) => !hidden.has(section.id));
  const knownIds = new Set(current.sections.map((section) => section.id));
  for (const patch of overlay.sections ?? []) {
    if (!knownIds.has(patch.id) && !patch.hidden) sections.push(createSection(patch));
  }
  if (overlay.sectionOrder) {
    const visibleIds = sections.map((section) => section.id);
    if (new Set(overlay.sectionOrder).size !== overlay.sectionOrder.length || overlay.sectionOrder.length !== visibleIds.length || overlay.sectionOrder.some((id) => !visibleIds.includes(id))) throw new Error("sectionOrder must contain every visible section exactly once");
    const byId = new Map(sections.map((section) => [section.id, section]));
    sections = overlay.sectionOrder.map((id) => byId.get(id)!);
  }
  const resolved = bindNavigation({
    ...current,
    header: { ...current.header, ...overlay.header }, hero: { ...current.hero, ...overlay.hero }, shortcutRail: { ...current.shortcutRail, ...overlay.shortcutRail }, footer: { ...current.footer, ...overlay.footer }, sections
  }, navigate);
  resolved.header.onSearchSubmit = (query) => navigate(`/search/${encodeURIComponent(query)}`);
  return resolved;
}
