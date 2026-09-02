import type { Locale } from "../lib/locales";

export const logoAssets: Record<
  Locale,
  { desktop: { light: string; dark: string }; mobile: { light: string; dark: string } }
> = {
  zh: {
    desktop: {
      light: new URL("../../../packages/design-system/assets/logos/yami-ui-cn-pc-fill.svg", import.meta.url).href,
      dark: new URL("../../../packages/design-system/assets/logos/yami-ui-cn-pc-fill-inverse.svg", import.meta.url).href,
    },
    mobile: {
      light: new URL("../../../packages/design-system/assets/logos/yami-ui-cn-mobile-fill.svg", import.meta.url).href,
      dark: new URL("../../../packages/design-system/assets/logos/yami-ui-cn-mobile-fill-inverse.svg", import.meta.url).href,
    },
  },
  en: {
    desktop: {
      light: new URL("../../../packages/design-system/assets/logos/yami-ui-en-pc-fill.svg", import.meta.url).href,
      dark: new URL("../../../packages/design-system/assets/logos/yami-ui-en-pc-fill-inverse.svg", import.meta.url).href,
    },
    mobile: {
      light: new URL("../../../packages/design-system/assets/logos/yami-ui-en-mobile-fill.svg", import.meta.url).href,
      dark: new URL("../../../packages/design-system/assets/logos/yami-ui-en-mobile-fill-inverse.svg", import.meta.url).href,
    },
  },
};

export const brandIcon = new URL("../../../packages/design-system/assets/logos/yami-icon-fill.svg", import.meta.url).href;
export const searchIcon = new URL("../../../packages/design-system/assets/icons/action/search.svg", import.meta.url).href;
export const arrowRightIcon = new URL("../../../packages/design-system/assets/icons/action/arrow-right.svg", import.meta.url).href;
