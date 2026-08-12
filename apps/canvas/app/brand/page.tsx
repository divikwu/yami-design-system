import type { Metadata } from "next";

import { StandaloneTopicPage } from "../ui/standalone-topic-page";

export const metadata: Metadata = {
  title: "ANUA Brand | Yami",
  description: "Explore ANUA skincare by routine, concern, and product category.",
};

export default function BrandLandingPage() {
  return <StandaloneTopicPage variant="brand" />;
}
