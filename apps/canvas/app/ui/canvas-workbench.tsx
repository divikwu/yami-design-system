"use client";

import { DirectionManifestV1Schema, PreviewNavigateMessageSchema, type DirectionManifestV1 } from "@yami/contracts";
import { motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DRAFTS_CHANGED_EVENT, readDrafts, upsertDraft, writeDrafts } from "../lib/drafts";
import { SegmentedControl, WorkbenchButton, WorkbenchSelect } from "./workbench-controls";

type Locale = "zh" | "en";
type Theme = "light" | "dark";
type Viewport = "402" | "768" | "1440";
const CANVAS_HISTORY_INDEX = "__yamiCanvasHistoryIndex";

function readCanvasHistoryIndex(state: unknown) {
  if (!state || typeof state !== "object") return null;
  const value = (state as Record<string, unknown>)[CANVAS_HISTORY_INDEX];
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

const canvasPages = [
  { value: "/", label: "Ecommerce Home" },
  { value: "/brands/anua", label: "Anua Topic Landing" },
] as const;
const localeOptions = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
] as const;
const themeOptions = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
] as const;
const viewportOptions = [
  { value: "402", label: "手机" },
  { value: "768", label: "平板" },
  { value: "1440", label: "桌面" },
] as const;

export function CanvasWorkbench() {
  const params = useSearchParams();
  const router = useRouter();
  const reduced = useReducedMotion();
  const fileInput = useRef<HTMLInputElement>(null);
  const previewFrame = useRef<HTMLIFrameElement>(null);
  const historyIndex = useRef(0);
  const pendingHistoryIndex = useRef<number | null>(null);
  const [drafts, setDrafts] = useState<DirectionManifestV1[]>([]);
  const [notice, setNotice] = useState("");
  const [canGoBack, setCanGoBack] = useState(false);
  const requestedPath = params.get("path") || "/";
  const pathResult = PreviewNavigateMessageSchema.safeParse({ type: "yami-design-system:v1:navigate", path: requestedPath });
  const path = pathResult.success ? pathResult.data.path : "/";
  const selectedPage = path === "/brands/11712"
    ? "/brands/anua"
    : canvasPages.some((page) => page.value === path) ? path : "";
  const direction = params.get("direction") || "current";
  const locale = (params.get("locale") === "en" ? "en" : "zh") as Locale;
  const theme = (params.get("theme") === "dark" ? "dark" : "light") as Theme;
  const requestedViewport = params.get("viewport");
  const viewport = (requestedViewport === "360"
    ? "402"
    : ["402", "768", "1440"].includes(requestedViewport ?? "") ? requestedViewport : "1440") as Viewport;
  const previousPreviewState = useRef({ path, direction });
  const pendingNavigationPath = useRef(path);
  const transition = previousPreviewState.current.path !== path ? "path" : previousPreviewState.current.direction !== direction ? "direction" : "none";

  const update = useCallback((next: Partial<{ path: string; direction: string; locale: Locale; theme: Theme; viewport: Viewport }>, mode: "push" | "replace" = "replace") => {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) query.set(key, value);
    const href = `/workbench?${query.toString()}`;
    if (mode === "push") {
      pendingHistoryIndex.current = (pendingHistoryIndex.current ?? historyIndex.current) + 1;
      router.push(href);
      return;
    }
    router.replace(href);
  }, [params, router]);

  useEffect(() => {
    if (requestedViewport === "360") update({ viewport: "402" });
  }, [requestedViewport, update]);

  useEffect(() => {
    const currentState = window.history.state;
    const storedIndex = readCanvasHistoryIndex(currentState);
    const nextIndex = pendingHistoryIndex.current ?? storedIndex ?? historyIndex.current;
    historyIndex.current = nextIndex;
    pendingHistoryIndex.current = null;

    if (storedIndex !== nextIndex) {
      const state = currentState && typeof currentState === "object" ? currentState : {};
      window.history.replaceState({ ...state, [CANVAS_HISTORY_INDEX]: nextIndex }, "");
    }
    setCanGoBack(nextIndex > 0);
  }, [path, direction, locale, theme, viewport]);

  useEffect(() => {
    const sync = () => setDrafts(readDrafts());
    sync();
    window.addEventListener(DRAFTS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(DRAFTS_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    previousPreviewState.current = { path, direction };
    pendingNavigationPath.current = path;
  }, [path, direction]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (previewFrame.current && event.source !== previewFrame.current.contentWindow) return;
      const message = PreviewNavigateMessageSchema.safeParse(event.data);
      if (!message.success) return;
      if (pendingNavigationPath.current === message.data.path) return;
      pendingNavigationPath.current = message.data.path;
      update({ path: message.data.path }, "push");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [update]);

  const previewQuery = useMemo(() => new URLSearchParams({ path, direction, locale, theme, viewport, transition }).toString(), [path, direction, locale, theme, viewport, transition]);
  const previewSrc = `/preview?${previewQuery}`;
  const initialPreviewSrc = useRef(previewSrc);
  const lastPreviewSrc = useRef(previewSrc);
  const directions = drafts;

  useEffect(() => {
    if (lastPreviewSrc.current === previewSrc) return;
    lastPreviewSrc.current = previewSrc;
    previewFrame.current?.contentWindow?.location.replace(previewSrc);
  }, [previewSrc]);

  function exportDraft() {
    const draft = directions.find((item) => item.id === direction);
    if (!draft) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }));
    link.download = `${draft.id}.json`; link.click(); URL.revokeObjectURL(link.href);
  }

  async function importDraft(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const draft = DirectionManifestV1Schema.parse(JSON.parse(await file.text())); upsertDraft(draft); update({ direction: draft.id }); setNotice("草稿已导入"); }
    catch { setNotice("JSON 不符合 Direction Manifest V1"); }
    event.target.value = "";
  }

  function deleteDraft() {
    if (!drafts.some((item) => item.id === direction)) return;
    writeDrafts(drafts.filter((item) => item.id !== direction)); update({ direction: "current" }); setNotice("本地草稿已删除");
  }

  function renameDraft() {
    const draft = drafts.find((item) => item.id === direction);
    if (!draft) return;
    const name = window.prompt("新的方向名称", draft.name)?.trim();
    if (!name) return;
    upsertDraft({ ...draft, name: name.slice(0, 80) });
    setNotice("本地草稿已重命名");
  }

  return (
    <main className="canvas-shell">
      <header className="canvas-header">
        <div className="brand-lockup"><strong>PROTOTYPE</strong></div>
        <div className="header-actions"><a href="http://localhost:6006" target="_blank" rel="noreferrer">Storybook ↗</a></div>
      </header>

      <section className="canvas-grid">
        <motion.aside className="control-panel" initial={{ opacity: 0, x: reduced ? 0 : -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
          <div className="panel-heading"><span>方案管理</span></div>
          <WorkbenchSelect
            label="页面"
            options={selectedPage ? canvasPages : [{ value: "", label: "其他路径" }, ...canvasPages]}
            value={selectedPage}
            onValueChange={(value) => update({ path: value }, "push")}
          />
          <WorkbenchSelect
            label="设计方案"
            options={[{ value: "current", label: "当前方案" }, ...directions.map((item) => ({ value: item.id, label: item.name }))]}
            value={direction}
            onValueChange={(value) => update({ direction: value })}
          />
          <div className="control-row">
            <WorkbenchSelect
              label="语言"
              options={localeOptions}
              value={locale}
              onValueChange={(value) => update({ locale: value as Locale })}
            />
            <WorkbenchSelect
              label="主题"
              options={themeOptions}
              value={theme}
              onValueChange={(value) => update({ theme: value as Theme })}
            />
          </div>
          <SegmentedControl
            label="设备"
            options={viewportOptions}
            value={viewport}
            onValueChange={(value) => update({ viewport: value as Viewport })}
          />
          <div className="path-readout"><span>当前路径</span><code>{path}</code></div>
          <div className="draft-actions">
            <WorkbenchButton onClick={exportDraft} disabled={direction === "current"}>导出</WorkbenchButton>
            <WorkbenchButton onClick={() => fileInput.current?.click()}>导入</WorkbenchButton>
            <WorkbenchButton onClick={renameDraft} disabled={!drafts.some((item) => item.id === direction)}>重命名</WorkbenchButton>
            <WorkbenchButton onClick={deleteDraft} disabled={!drafts.some((item) => item.id === direction)}>删除</WorkbenchButton>
            <input ref={fileInput} type="file" accept="application/json" hidden onChange={importDraft} />
          </div>
          <div className="ai-composer"><div className="panel-heading"><span>AI 设计工作流</span><small>CODEX / KIRO</small></div><p>在 Codex 或 Kiro 中生成 Direction Manifest V1 JSON，再导入 Canvas 进行校验、切换和评审。</p><WorkbenchButton variant="emphasis" size="default" onClick={() => fileInput.current?.click()}>导入 AI 方案</WorkbenchButton>{notice && <p className="notice" role="status">{notice}</p>}</div>
        </motion.aside>

        <section className="preview-stage" aria-label="原型预览区">
          <div className="stage-bar">
            {canGoBack && <button className="stage-back" onClick={() => router.back()} aria-label="返回上一步">← 返回</button>}
            <span className="stage-meta">{viewport} PX · {theme.toUpperCase()} · {locale.toUpperCase()}</span>
          </div>
          <div className="device-mat">
            <div className="preview-frame-wrap" style={{ width: `min(100%, ${viewport}px)` }}><iframe ref={previewFrame} title="YAMI 原型预览" src={initialPreviewSrc.current} /></div>
          </div>
        </section>
      </section>
    </main>
  );
}
