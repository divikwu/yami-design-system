import { createBrandProductRailProps } from "@yami/design-system/components/BrandProductRail/fixtures";

import {
  createTopicLandingPageFixture,
  type TopicLandingPageLocale,
} from "./fixtures";

/** Campaign keeps four skincare categories from the Brand fixture. */
export function createCampaignTopicLandingPageFixture(
  locale: TopicLandingPageLocale = "en",
) {
  const fixture = createTopicLandingPageFixture(locale);
  fixture.shortcutRail.items = fixture.shortcutRail.items.slice(0, 4);
  if (fixture.standardRail) {
    fixture.standardRail.themes = fixture.standardRail.themes?.slice(0, 4);
  }
  fixture.productRail.tabs = fixture.productRail.tabs?.slice(0, 5);
  const removedCategories = ["sunscreens", "face-masks", "makeup"];
  fixture.waterfall.tabs = fixture.waterfall.tabs?.filter(
    (tab) => !removedCategories.includes(tab.value),
  );
  for (const category of removedCategories) {
    delete fixture.waterfall.productsByTab?.[category];
  }

  return {
    ...fixture,
    brandRail: {
      ...createBrandProductRailProps(locale, "#all-brands"),
      mobileSurface: "plain" as const,
      dividerPosition: "top" as const,
      dividerVariant: "gray" as const,
    },
  };
}
