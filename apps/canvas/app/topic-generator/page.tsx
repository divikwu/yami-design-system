import type { Metadata } from "next";
import {
  TopicGenerator,
  topicGeneratorMetadata,
} from "@yami/topic-generator/web";

export const metadata: Metadata = topicGeneratorMetadata;

export default function TopicGeneratorPage() {
  return <TopicGenerator />;
}
