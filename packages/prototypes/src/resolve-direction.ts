import type { DirectionManifestV1, HomeSectionPatch } from "@yami/contracts";
import type { EcommerceHomeProps, EcommerceHomeSection } from "../pages/EcommerceHome";
import { createEcommerceHomeFixture, type EcommerceHomeLocale } from "../pages/EcommerceHome";
import { bindNavigation, type Navigate } from "./navigation";

function mergeSection(section: EcommerceHomeSection, patch: HomeSectionPatch): EcommerceHomeSection {
  if (section.kind !== patch.kind) throw new Error(`Section ${section.id} cannot change kind`);
  return { ...section, props: { ...section.props, ...(patch.props ?? {}) } } as EcommerceHomeSection;
}

export function resolveEcommerceHome(locale: EcommerceHomeLocale, manifest: DirectionManifestV1 | null, navigate: Navigate): EcommerceHomeProps {
  const current = createEcommerceHomeFixture(locale);
  const overlay = manifest?.pages.home;
  if (!overlay) return bindNavigation(current, navigate);

  const patches = new Map((overlay.sections ?? []).map((patch) => [patch.id, patch]));
  const hidden = new Set((overlay.sections ?? []).filter((patch) => patch.hidden).map((patch) => patch.id));
  let sections = current.sections.map((section) => patches.has(section.id) ? mergeSection(section, patches.get(section.id)!) : section).filter((section) => !hidden.has(section.id));
  const knownIds = new Set(current.sections.map((section) => section.id));
  for (const patch of overlay.sections ?? []) {
    if (!knownIds.has(patch.id) && !patch.hidden) throw new Error(`New section ${patch.id} requires complete props and is not enabled in MVP`);
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
