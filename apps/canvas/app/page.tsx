import { Suspense } from "react";
import { CanvasWorkbench } from "./ui/canvas-workbench";

export default function HomePage() {
  return <Suspense fallback={<main className="app-loading">正在打开 YAMI Canvas…</main>}><CanvasWorkbench /></Suspense>;
}
