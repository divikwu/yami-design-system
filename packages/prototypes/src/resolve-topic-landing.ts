import {
  createTopicLandingPageFixture,
  type TopicLandingPageLocale,
  type TopicLandingPageProps,
} from "../pages/TopicLandingPage";
import { bindNavigation, type Navigate } from "./navigation";

export function resolveTopicLandingPage(
  locale: TopicLandingPageLocale,
  navigate: Navigate,
): TopicLandingPageProps {
  const current = createTopicLandingPageFixture(locale);
  const resolved = bindNavigation(current, navigate);

  resolved.header.onSearchSubmit = (query) =>
    navigate(`/search/${encodeURIComponent(query)}`);
  resolved.activityHeader.onSearch = () => navigate("/search/all");
  resolved.activityHeader.onCart = () => navigate("/cart");
  resolved.shortcutRail.items = resolved.shortcutRail.items.map((item, index) => ({
    ...item,
    href: current.shortcutRail.items[index]?.href,
  }));

  return resolved;
}
