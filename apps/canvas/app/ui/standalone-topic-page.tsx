"use client";

import {
  createTopicKeywordLandingPageFixture,
  createTopicLandingPageFixture,
  TopicLandingPage,
} from "@yami/prototypes";
import "@yami/design-system/styles/base.css";

type StandaloneTopicPageProps = {
  variant: "brand" | "topic";
};

export function StandaloneTopicPage({ variant }: StandaloneTopicPageProps) {
  const props =
    variant === "brand"
      ? createTopicLandingPageFixture("en")
      : createTopicKeywordLandingPageFixture("en");

  return (
    <div className="prototype-root" data-theme="light">
      <TopicLandingPage {...props} />
    </div>
  );
}
