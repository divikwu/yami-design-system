import { Suspense } from "react";
import { PreviewSurface } from "../ui/preview-surface";

export default function PreviewPage() {
  return <Suspense fallback={<div className="preview-loading" aria-label="正在加载原型" />}><PreviewSurface /></Suspense>;
}
