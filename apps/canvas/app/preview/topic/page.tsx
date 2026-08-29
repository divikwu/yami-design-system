import type { Metadata } from "next";
import { Suspense } from "react";
import { StandalonePreviewSurface } from "../../ui/standalone-preview-surface";

export const metadata: Metadata = {
  title: "Explore Matcha | Yami",
  description: "Explore matcha powders, drinks, sweets, tools, and pairings.",
};

export default function TopicPreviewPage() {
  return (
    <Suspense fallback={<div className="preview-loading" aria-label="Loading prototype" />}>
      <StandalonePreviewSurface preview="topic" />
    </Suspense>
  );
}
