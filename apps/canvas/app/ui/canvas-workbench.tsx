"use client";

import { PreviewNavigateMessageSchema } from "@yami/contracts";
import { motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SegmentedControl, WorkbenchButton, WorkbenchLink, WorkbenchSelect } from "./workbench-controls";

type Locale = "zh" | "en";
type Theme = "light" | "dark";
type Viewport = "402" | "768" | "1440";
const CANVAS_HISTORY_INDEX = "__yamiCanvasHistoryIndex";
const STORYBOOK_URL = process.env.NEXT_PUBLIC_STORYBOOK_URL
  ?? (process.env.NODE_ENV === "production"
    ? "https://yami-design-system-storybook.vercel.app"
    : "http://localhost:6006");
const STORYBOOK_PAGE_PREFIX = "YAMI/Pages/";

interface StorybookPage {
  id: string;
  label: string;
  title: string;
}

type StorybookLoadState = "idle" | "loading" | "ready" | "error";

function readCanvasHistoryIndex(state: unknown) {
  if (!state || typeof state !== "object") return null;
  const value = (state as Record<string, unknown>)[CANVAS_HISTORY_INDEX];
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function readStorybookPages(payload: unknown): StorybookPage[] {
  if (!payload || typeof payload !== "object") return [];
  const entries = (payload as { entries?: unknown }).entries;
  if (!entries || typeof entries !== "object") return [];

  const grouped = new Map<string, { id: string; name: string; title: string }[]>();
  for (const entry of Object.values(entries)) {
    if (!entry || typeof entry !== "object") continue;
    const { id, name, title, type } = entry as Record<string, unknown>;
    if (type !== "story" || typeof id !== "string" || typeof name !== "string" || typeof title !== "string" || !title.startsWith(STORYBOOK_PAGE_PREFIX)) continue;
    grouped.set(title, [...(grouped.get(title) ?? []), { id, name, title }]);
  }

  return [...grouped.values()]
    .map((stories) => {
      const story = stories.find((item) => /(^|—|\s)PC$/.test(item.name)) ?? stories[0];
      return {
        id: story.id,
        label: story.title.slice(STORYBOOK_PAGE_PREFIX.length).replaceAll("/", " / "),
        title: story.title,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
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
  const importDialog = useRef<HTMLDialogElement>(null);
  const previewFrame = useRef<HTMLIFrameElement>(null);
  const historyIndex = useRef(0);
  const pendingHistoryIndex = useRef<number | null>(null);
  const [storybookPages, setStorybookPages] = useState<StorybookPage[]>([]);
  const [importedPages, setImportedPages] = useState<StorybookPage[]>([]);
  const [storybookLoadState, setStorybookLoadState] = useState<StorybookLoadState>("idle");
  const [canGoBack, setCanGoBack] = useState(false);
  const requestedPath = params.get("path") || "/";
  const pathResult = PreviewNavigateMessageSchema.safeParse({ type: "yami-design-system:v1:navigate", path: requestedPath });
  const path = pathResult.success ? pathResult.data.path : "/";
  const storyId = params.get("story") || "";
  const selectedCanvasPage = path === "/brands/11712"
    ? "/brands/anua"
    : canvasPages.some((page) => page.value === path) ? path : "";
  const direction = params.get("direction") || "current";
  const locale = (params.get("locale") === "en" ? "en" : "zh") as Locale;
  const theme = (params.get("theme") === "dark" ? "dark" : "light") as Theme;
  const requestedViewport = params.get("viewport");
  const viewport = (requestedViewport === "360"
    ? "402"
    : ["402", "768", "1440"].includes(requestedViewport ?? "") ? requestedViewport : "1440") as Viewport;
  const previousPreviewState = useRef({ path, direction, storyId });
  const pendingNavigationPath = useRef(path);
  const transition = previousPreviewState.current.path !== path || previousPreviewState.current.storyId !== storyId
    ? "path"
    : previousPreviewState.current.direction !== direction ? "direction" : "none";

  const currentImportedPage = storyId && !importedPages.some((page) => page.id === storyId)
    ? storybookPages.find((page) => page.id === storyId) ?? { id: storyId, label: "Storybook 页面", title: storyId }
    : null;
  const visibleImportedPages = currentImportedPage ? [...importedPages, currentImportedPage] : importedPages;
  const pageOptions = [
    ...canvasPages,
    ...visibleImportedPages.map((page) => ({ value: `storybook:${page.id}`, label: page.label })),
  ];
  const selectedPage = storyId
    ? `storybook:${storyId}`
    : selectedCanvasPage;

  const update = useCallback((next: Partial<{ path: string | null; story: string | null; direction: string; locale: Locale; theme: Theme; viewport: Viewport }>, mode: "push" | "replace" = "replace") => {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) query.delete(key);
      else query.set(key, value);
    }
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
  }, [path, direction, locale, theme, viewport, storyId]);

  useEffect(() => {
    previousPreviewState.current = { path, direction, storyId };
    pendingNavigationPath.current = path;
  }, [path, direction, storyId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (previewFrame.current && event.source !== previewFrame.current.contentWindow) return;
      const message = PreviewNavigateMessageSchema.safeParse(event.data);
      if (!message.success) return;
      if (pendingNavigationPath.current === message.data.path) return;
      pendingNavigationPath.current = message.data.path;
      update({ path: message.data.path, story: null }, "push");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [update]);

  const previewSrc = useMemo(() => {
    if (storyId) {
      const storybookQuery = new URLSearchParams({
        id: storyId,
        viewMode: "story",
        globals: `locale:${locale};theme:${theme}`,
      });
      return `${STORYBOOK_URL}/iframe.html?${storybookQuery.toString()}`;
    }
    const previewQuery = new URLSearchParams({ path, direction, locale, theme, viewport, transition });
    return `/preview?${previewQuery.toString()}`;
  }, [path, direction, locale, theme, viewport, transition, storyId]);

  const loadStorybookPages = useCallback(async () => {
    if (storybookLoadState === "loading" || storybookLoadState === "ready") return;
    setStorybookLoadState("loading");
    try {
      const response = await fetch(`${STORYBOOK_URL}/index.json`);
      if (!response.ok) throw new Error(`Storybook returned ${response.status}`);
      const pages = readStorybookPages(await response.json());
      if (pages.length === 0) throw new Error("Storybook has no page stories");
      setStorybookPages(pages);
      if (storyId) {
        const selectedStory = pages.find((page) => page.id === storyId);
        if (selectedStory) setImportedPages((current) => current.some((page) => page.id === storyId) ? current : [...current, selectedStory]);
      }
      setStorybookLoadState("ready");
    } catch {
      setStorybookLoadState("error");
    }
  }, [storybookLoadState, storyId]);

  useEffect(() => {
    if (storyId) void loadStorybookPages();
  }, [storyId, loadStorybookPages]);

  function openStorybookImporter() {
    if (!importDialog.current?.open) importDialog.current?.showModal();
    void loadStorybookPages();
  }

  function importStorybookPage(page: StorybookPage) {
    setImportedPages((current) => current.some((item) => item.id === page.id) ? current : [...current, page]);
    importDialog.current?.close();
    update({ path: null, story: page.id }, "push");
  }

  function selectPage(value: string) {
    if (value.startsWith("storybook:")) {
      update({ path: null, story: value.slice("storybook:".length) }, "push");
      return;
    }
    update({ path: value, story: null }, "push");
  }

  return (
    <main className="canvas-shell">
      <header className="canvas-header">
        <div className="brand-lockup"><strong>PROTOTYPE</strong></div>
        <div className="header-actions"><WorkbenchButton onClick={openStorybookImporter}>导入</WorkbenchButton><WorkbenchLink href={STORYBOOK_URL} target="_blank" rel="noreferrer">Storybook ↗</WorkbenchLink></div>
      </header>

      <section className="canvas-grid">
        <motion.aside className="control-panel" initial={{ opacity: 0, x: reduced ? 0 : -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
          <div className="panel-heading"><span>页面管理</span></div>
          <WorkbenchSelect
            label="页面"
            options={selectedPage ? pageOptions : [{ value: "", label: "其他路径" }, ...pageOptions]}
            value={selectedPage}
            onValueChange={selectPage}
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
          <div className="path-readout"><span>{storyId ? "Storybook Story" : "当前路径"}</span><code>{storyId || path}</code></div>
        </motion.aside>

        <section className="preview-stage" aria-label="原型预览区">
          <div className="stage-bar">
            {canGoBack && <button className="stage-back" onClick={() => router.back()} aria-label="返回上一步">← 返回</button>}
            <span className="stage-meta">{viewport} PX · {theme.toUpperCase()} · {locale.toUpperCase()}</span>
          </div>
          <div className="device-mat">
            <div className="preview-frame-wrap" style={{ width: `min(100%, ${viewport}px)` }}><iframe key={previewSrc} ref={previewFrame} title="YAMI 原型预览" src={previewSrc} /></div>
          </div>
        </section>
      </section>

      <dialog ref={importDialog} className="storybook-import-dialog" aria-labelledby="storybook-import-title">
        <div className="storybook-import-header">
          <div>
            <h2 id="storybook-import-title">从 Storybook 导入页面</h2>
            <p>选择一个页面并在 Canvas 中预览。</p>
          </div>
          <button type="button" aria-label="关闭导入页面弹窗" onClick={() => importDialog.current?.close()}>×</button>
        </div>
        <div className="storybook-page-list">
          {storybookLoadState === "loading" && <p role="status">正在读取 Storybook 页面…</p>}
          {storybookLoadState === "error" && <div className="storybook-import-error"><p role="alert">无法读取 Storybook 页面，请确认 Storybook 已启动。</p><WorkbenchButton onClick={loadStorybookPages}>重试</WorkbenchButton></div>}
          {storybookLoadState === "ready" && storybookPages.map((page) => (
            <button key={page.id} type="button" className="storybook-page-option" aria-label={page.label} onClick={() => importStorybookPage(page)}>
              <strong>{page.label}</strong>
              <span>{page.title}</span>
            </button>
          ))}
        </div>
      </dialog>
    </main>
  );
}
