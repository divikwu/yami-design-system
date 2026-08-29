import type { Metadata } from "next";
import { Suspense } from "react";
import { StandalonePreviewSurface } from "../../ui/standalone-preview-surface";

export const metadata: Metadata = {
  title: "Ecommerce Home | Yami",
  description: "Explore the Yami ecommerce homepage prototype.",
};

export default function EcommerceHomePreviewPage() {
  return (
    <Suspense fallback={<div className="preview-loading" aria-label="Loading prototype" />}>
      <StandalonePreviewSurface preview="ecommerce-home" />
    </Suspense>
  );
}
