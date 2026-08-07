import { Suspense } from "react";
import { PreviewSurface } from "../ui/preview-surface";

export default function EnglishHomePage() {
  return <Suspense fallback={<div className="preview-loading" aria-label="Loading prototype" />}><PreviewSurface localeOverride="en" /></Suspense>;
}
