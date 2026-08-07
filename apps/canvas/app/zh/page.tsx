import { Suspense } from "react";
import { PreviewSurface } from "../ui/preview-surface";

export default function ChineseHomePage() {
  return <Suspense fallback={<div className="preview-loading" aria-label="正在加载原型" />}><PreviewSurface localeOverride="zh" /></Suspense>;
}
