import type { Metadata } from "next";

import type { Locale } from "./locales";
import { localizedPath } from "./locales";
import { siteUrl } from "./site-config";

export function localizedAlternates(locale: Locale, path = ""): Metadata["alternates"] {
  const localized = localizedPath(locale, path);
  return {
    canonical: `${siteUrl}${localized}`,
    languages: {
      "zh-CN": `${siteUrl}${localizedPath("zh", path)}`,
      "en-US": `${siteUrl}${localizedPath("en", path)}`,
    },
  };
}
