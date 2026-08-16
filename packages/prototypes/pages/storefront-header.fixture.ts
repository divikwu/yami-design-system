import type { HeaderProps } from "@yami/design-system";
import { createHeaderProps } from "@yami/design-system/components/Header/fixtures";

export type StorefrontLocale = "zh" | "en";

/** Shared linked header for storefront pages. */
export function createStorefrontHeader(
  locale: StorefrontLocale,
): HeaderProps {
  const header = createHeaderProps(locale, { href: (slot) => `#${slot}` });
  const matchaLandingHref =
    `/iframe.html?id=yami-pages-topic-landing-page-topic--pc&viewMode=story&globals=locale%3A${locale}`;
  const matchaSearchHref =
    `/iframe.html?id=yami-pages-search-results--results&viewMode=story&globals=locale%3A${locale}`;

  return {
    ...header,
    cart: { ...header.cart, count: 2 },
    mobileSearchHref:
      `/iframe.html?id=yami-pages-mobile-search--empty&viewMode=story&globals=locale%3A${locale}`,
    searchPanel: header.searchPanel
      ? {
          ...header.searchPanel,
          recent: header.searchPanel.recent.map((tag, index) =>
            index === 0
              ? { label: "matcha powder", href: matchaSearchHref }
              : tag,
          ),
          popular: header.searchPanel.popular.map((tag, index) =>
            index === 0 ? { label: "matcha", href: matchaLandingHref } : tag,
          ),
        }
      : undefined,
    onSearchSubmit: () => {},
  };
}
