import type { Metadata } from "next";

import { StandaloneTopicPage } from "../ui/standalone-topic-page";

export const metadata: Metadata = {
  title: "Explore Matcha | Yami",
  description: "Explore matcha powders, drinks, sweets, tools, and pairings.",
};

export default function MatchaTopicLandingPage() {
  return <StandaloneTopicPage variant="topic" />;
}
