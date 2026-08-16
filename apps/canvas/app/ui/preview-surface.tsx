"use client";

import { tokenOverridesToStyle, type DirectionManifestV1 } from "@yami/contracts";
import {
  EcommerceHomeTemplate,
  resolveEcommerceHome,
  resolveTopicLandingPage,
  TopicLandingPage,
} from "@yami/prototypes";
import { motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { findDraft } from "../lib/drafts";
import { getPreviewMotion, type PreviewTransition } from "../lib/motion";
import "@yami/design-system/styles/base.css";

const anuaTopicPaths = new Set(["/brands/anua", "/brands/11712"]);

export function PreviewSurface({ localeOverride }: { localeOverride?: "en" | "zh" } = {}) {
  const params = useSearchParams();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [manifest, setManifest] = useState<DirectionManifestV1 | null>(null);
  const path = params.get("path") || "/";
  const locale = localeOverride ?? (params.get("locale") === "en" ? "en" : "zh");
  const theme = params.get("theme") === "dark" ? "dark" : "light";
  const direction = params.get("direction") || "current";
  const transition: PreviewTransition = params.get("transition") === "path" ? "path" : params.get("transition") === "direction" ? "direction" : "none";
  const navigate = useCallback((nextPath: string) => window.parent.postMessage({ type: "yami-design-system:v1:navigate", path: nextPath }, window.location.origin), []);

  useEffect(() => {
    setManifest(direction === "current" ? null : findDraft(direction));
    setReady(true);
  }, [direction]);

  useEffect(() => {
    const interceptNavigation = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target) return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search &&
        destination.hash
      ) return;
      event.preventDefault();
      navigate(destination.pathname);
    };
    document.addEventListener("click", interceptNavigation, true);
    return () => document.removeEventListener("click", interceptNavigation, true);
  }, [navigate]);

  const homeProps = useMemo(() => ready && path === "/" ? resolveEcommerceHome(locale, manifest, navigate) : null, [ready, path, locale, manifest, navigate]);
  const topicProps = useMemo(() => ready && anuaTopicPaths.has(path) ? resolveTopicLandingPage(locale, navigate) : null, [ready, path, locale, navigate]);
  const tokenStyle = path === "/"
    ? tokenOverridesToStyle(manifest?.pages.home?.tokenOverrides ?? {}) as CSSProperties
    : {};
  const { initial, duration } = getPreviewMotion(transition, Boolean(reduced));

  if (!ready) return <div className="preview-loading" aria-label="正在加载方向" />;
  return (
    <motion.div className={`prototype-root${theme === "dark" ? " dark" : ""}`} data-theme={theme} style={tokenStyle} initial={initial} animate={{ opacity: 1, y: 0 }} transition={{ duration }}>
      {homeProps ? <EcommerceHomeTemplate {...homeProps} /> : topicProps ? <TopicLandingPage {...topicProps} /> : <PlaceholderRoute path={path} onBack={() => navigate("/")} />}
    </motion.div>
  );
}

function PlaceholderRoute({ path, onBack }: { path: string; onBack(): void }) {
  const name = path.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") || "page";
  return <main className="placeholder-route"><span>YAMI PROTOTYPE ROUTE</span><h1>{name}</h1><p>这个页面已接入真实导航，具体内容将在后续原型阶段补充。</p><button onClick={onBack}>← 返回 Ecommerce Home</button></main>;
}
