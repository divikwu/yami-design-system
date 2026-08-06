"use client";

import { DirectionManifestV1Schema, PreviewNavigateMessageSchema, type DirectionManifestV1 } from "@yami/contracts";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import fixture from "../generated-direction.fixture.json";
import { readDrafts, upsertDraft, writeDrafts } from "../lib/drafts";

type Locale = "zh" | "en";
type Theme = "light" | "dark";
type Viewport = "360" | "768" | "1440";
const generatedFixture = DirectionManifestV1Schema.parse(fixture);

export function CanvasWorkbench() {
  const params = useSearchParams();
  const router = useRouter();
  const reduced = useReducedMotion();
  const fileInput = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<DirectionManifestV1[]>([]);
  const [notice, setNotice] = useState("");
  const path = params.get("path") || "/";
  const direction = params.get("direction") || "current";
  const locale = (params.get("locale") === "en" ? "en" : "zh") as Locale;
  const theme = (params.get("theme") === "dark" ? "dark" : "light") as Theme;
  const viewport = (["360", "768", "1440"].includes(params.get("viewport") ?? "") ? params.get("viewport") : "1440") as Viewport;

  useEffect(() => {
    const sync = () => setDrafts(readDrafts());
    sync();
    window.addEventListener("yami-canvas:drafts-changed", sync);
    return () => window.removeEventListener("yami-canvas:drafts-changed", sync);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = PreviewNavigateMessageSchema.safeParse(event.data);
      if (!message.success) return;
      update({ path: message.data.path }, "push");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  });

  function update(next: Partial<{ path: string; direction: string; locale: Locale; theme: Theme; viewport: Viewport }>, mode: "push" | "replace" = "replace") {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) query.set(key, value);
    router[mode](`/?${query.toString()}`);
  }

  const previewQuery = useMemo(() => new URLSearchParams({ path, direction, locale, theme, viewport }).toString(), [path, direction, locale, theme, viewport]);
  const directions = [generatedFixture, ...drafts];

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
        <div className="brand-lockup"><span className="brand-mark">Y</span><div><strong>YAMI Canvas</strong><span>AI 原型工作台</span></div></div>
        <div className="header-actions"><a href="http://localhost:6006" target="_blank" rel="noreferrer">Storybook ↗</a><button onClick={() => router.back()} aria-label="返回上一步">← 返回</button></div>
      </header>

      <section className="canvas-grid">
        <motion.aside className="control-panel" initial={{ opacity: 0, x: reduced ? 0 : -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
          <div className="panel-heading"><span>方向控制</span><small>01 / CURRENT</small></div>
          <label>设计方向<select value={direction} onChange={(event) => update({ direction: event.target.value })}><option value="current">Current · 当前方案</option>{directions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <div className="control-row"><label>语言<select value={locale} onChange={(event) => update({ locale: event.target.value as Locale })}><option value="zh">中文</option><option value="en">English</option></select></label><label>主题<select value={theme} onChange={(event) => update({ theme: event.target.value as Theme })}><option value="light">浅色</option><option value="dark">深色</option></select></label></div>
          <fieldset><legend>设备</legend><div className="segmented">{(["360", "768", "1440"] as const).map((value) => <button key={value} className={viewport === value ? "active" : ""} onClick={() => update({ viewport: value })}>{value === "360" ? "手机" : value === "768" ? "平板" : "桌面"}</button>)}</div></fieldset>
          <div className="path-readout"><span>当前路径</span><code>{path}</code></div>
          <div className="draft-actions"><button onClick={exportDraft} disabled={direction === "current"}>导出</button><button onClick={() => fileInput.current?.click()}>导入</button><button onClick={renameDraft} disabled={!drafts.some((item) => item.id === direction)}>重命名</button><button onClick={deleteDraft} disabled={!drafts.some((item) => item.id === direction)}>删除</button><input ref={fileInput} type="file" accept="application/json" hidden onChange={importDraft} /></div>
          <div className="ai-composer"><div className="panel-heading"><span>AI 设计工作流</span><small>CODEX / KIRO</small></div><p>在 Codex 或 Kiro 中生成 Direction Manifest V1 JSON，再导入 Canvas 进行校验、切换和评审。</p><button className="primary" onClick={() => fileInput.current?.click()}>导入 AI 方案</button>{notice && <p className="notice" role="status">{notice}</p>}</div>
        </motion.aside>

        <section className="preview-stage" aria-label="原型预览区">
          <div className="stage-bar"><span><i /> LIVE PROTOTYPE</span><span>{viewport} PX · {theme.toUpperCase()} · {locale.toUpperCase()}</span></div>
          <div className="device-mat">
            <AnimatePresence mode="wait" initial={false}><motion.div key={`${direction}:${path}`} className="preview-frame-wrap" style={{ width: `min(100%, ${viewport}px)` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }}><iframe title="YAMI 原型预览" src={`/preview?${previewQuery}`} /></motion.div></AnimatePresence>
          </div>
        </section>
      </section>
    </main>
  );
}
