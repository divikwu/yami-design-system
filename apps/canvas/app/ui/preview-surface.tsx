"use client";

import { DirectionManifestV1Schema, tokenOverridesToStyle, type DirectionManifestV1 } from "@yami/contracts";
import { EcommerceHomeTemplate, resolveEcommerceHome } from "@yami/prototypes";
import { motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import fixture from "../generated-direction.fixture.json";
import { findDraft } from "../lib/drafts";
import { getPreviewMotion, type PreviewTransition } from "../lib/motion";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";

const fixed = DirectionManifestV1Schema.parse(fixture);

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
  const navigate = useCallback((nextPath: string) => window.parent.postMessage({ type: "yami-canvas:v1:navigate", path: nextPath }, window.location.origin), []);

  useEffect(() => {
    setManifest(direction === "current" ? null : direction === fixed.id ? fixed : findDraft(direction));
    setReady(true);
  }, [direction]);

  useEffect(() => {
    const interceptNavigation = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target) return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      event.preventDefault();
      navigate(destination.pathname);
    };
    document.addEventListener("click", interceptNavigation, true);
    return () => document.removeEventListener("click", interceptNavigation, true);
  }, [navigate]);

  const props = useMemo(() => ready && path === "/" ? resolveEcommerceHome(locale, manifest, navigate) : null, [ready, path, locale, manifest, navigate]);
  const tokenStyle = tokenOverridesToStyle(manifest?.pages.home?.tokenOverrides ?? {}) as CSSProperties;
  const { initial, duration } = getPreviewMotion(transition, Boolean(reduced));

  if (!ready) return <div className="preview-loading" aria-label="正在加载方向" />;
  return (
    <motion.div className={`prototype-root${theme === "dark" ? " dark" : ""}`} data-theme={theme} style={tokenStyle} initial={initial} animate={{ opacity: 1, y: 0 }} transition={{ duration }}>
      {props ? <EcommerceHomeTemplate {...props} /> : <PlaceholderRoute path={path} onBack={() => navigate("/")} />}
    </motion.div>
  );
}

function PlaceholderRoute({ path, onBack }: { path: string; onBack(): void }) {
  const name = path.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") || "page";
  return <main className="placeholder-route"><span>YAMI PROTOTYPE ROUTE</span><h1>{name}</h1><p>这个页面已接入真实导航，具体内容将在后续原型阶段补充。</p><button onClick={onBack}>← 返回 Ecommerce Home</button></main>;
}
