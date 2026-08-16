import type { Metadata } from "next";
import { TopicGenerator } from "./topic-generator-client";

export const metadata: Metadata = {
  title: "Topic Page Generator · Yami Design System",
  description: "Search Yami products and assemble an explainable Topic Landing Page plan.",
};

export default function TopicGeneratorPage() {
  return <TopicGenerator />;
}
