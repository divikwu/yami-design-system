import type { Metadata } from "next";
import { Suspense } from "react";
import { StandalonePreviewSurface } from "../../ui/standalone-preview-surface";

export const metadata: Metadata = {
  title: "ANUA Brand | Yami",
  description: "Explore ANUA skincare by routine, concern, and product category.",
};

export default function BrandPreviewPage() {
  return (
    <Suspense fallback={<div className="preview-loading" aria-label="Loading prototype" />}>
      <StandalonePreviewSurface preview="brand" />
    </Suspense>
  );
}
