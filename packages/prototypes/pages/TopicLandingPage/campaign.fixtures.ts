import { createBrandProductRailProps } from "@yami/design-system/components/BrandProductRail/fixtures";

import {
  createTopicLandingPageFixture,
  type TopicLandingPageLocale,
} from "./fixtures";

/**
 * Starts as a deliberate copy of Brand. Specialize Campaign content here when
 * its maintained copy diverges.
 */
export function createCampaignTopicLandingPageFixture(
  locale: TopicLandingPageLocale = "en",
) {
  return {
    ...createTopicLandingPageFixture(locale),
    brandRail: {
      ...createBrandProductRailProps(locale, "#all-brands"),
      mobileSurface: "plain" as const,
      dividerPosition: "top" as const,
      dividerVariant: "gray" as const,
    },
  };
}
