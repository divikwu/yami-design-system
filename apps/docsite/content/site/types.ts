import type { Locale } from "../../lib/locales";
import type { DocGroup } from "../../lib/docs-navigation";

export interface SiteCopy {
  locale: Locale;
  metadata: { title: string; description: string };
  nav: { home: string; docs: string; blog: string; label: string };
  utilities: {
    search: string;
    searchPlaceholder: string;
    searchHint: string;
    searchNavigate: string;
    searchSelect: string;
    noResults: string;
    menu: string;
    close: string;
    language: string;
    lightMode: string;
    darkMode: string;
    theme: string;
    storybook: string;
    github: string;
  };
  home: {
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    status: string;
    previewTitle: string;
    previewDescription: string;
    capabilitiesTitle: string;
    capabilitiesDescription: string;
    capabilities: Array<{ title: string; description: string }>;
    foundationsTitle: string;
    foundationsDescription: string;
    latestTitle: string;
    latestDescription: string;
    docsFeatureTitle: string;
    docsFeatureDescription: string;
    foundationsAction: string;
    agentAction: string;
    docsAction: string;
    aboutTitle: string;
    aboutDescription: string;
    aboutActions: [string, string, string];
    latestAction: string;
    discoverTitle: string;
    discoverDescription: string;
    validationLabels: [string, string, string];
  };
  docs: {
    label: string;
    menu: string;
    onThisPage: string;
    updated: string;
    previous: string;
    next: string;
    groups: Record<DocGroup, string>;
    resources: Record<"components" | "foundations" | "pages", string>;
  };
  blog: {
    title: string;
    description: string;
    all: string;
    categories: Record<"update" | "design" | "engineering", string>;
    empty: string;
    readingTime: (minutes: number) => string;
    related: string;
    previous: string;
    next: string;
  };
  footer: {
    description: string;
    resources: string;
    legal: string;
    version: string;
    license: string;
    rights: string;
  };
  notFound: { title: string; description: string; action: string };
}
