import "@yami/design-system/styles/base.css";
import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TopicLandingPage } from "@yami/prototypes/topic-landing-page";
import type { TopicPagePreviewRendererProps } from "@yami/topic-generator/web";
import {
  contentPrototypeProps,
  generatedPrototypeProps,
  selectionPrototypeProps,
} from "../app/topic-generator-workbench";

type SelectionPreview = Extract<TopicPagePreviewRendererProps, { mode: "selection" }>;
type ContentPreview = Extract<TopicPagePreviewRendererProps, { mode: "content" }>;
type GeneratedPreview = Extract<TopicPagePreviewRendererProps, { mode: "generated" }>;

type OfflinePayload =
  | {
      mode: "selection";
      showChrome: boolean;
      pageTypeRef: SelectionPreview["pageTypeRef"];
      plan: SelectionPreview["plan"];
      warnings: string[];
    }
  | {
      mode: "content";
      showChrome: boolean;
      pageTypeRef: ContentPreview["pageTypeRef"];
      plan: ContentPreview["plan"];
      contentSpec: ContentPreview["contentSpec"];
      retainedVisualSpec?: ContentPreview["retainedVisualSpec"];
      warnings: string[];
    }
  | {
      mode: "generated";
      showChrome: boolean;
      pageTypeRef: GeneratedPreview["pageTypeRef"];
      generationSpec: GeneratedPreview["generationSpec"];
      warnings: string[];
    };

const OFFLINE_MEDIA_REF_PREFIX = "topic-generator-media://";

function hydrateOfflineMedia(value: unknown, media: string[]): unknown {
  if (typeof value === "string" && value.startsWith(OFFLINE_MEDIA_REF_PREFIX)) {
    const index = Number(value.slice(OFFLINE_MEDIA_REF_PREFIX.length));
    if (!Number.isInteger(index) || index < 0 || index >= media.length) {
      throw new Error("Offline page media reference is invalid.");
    }
    return media[index];
  }
  if (Array.isArray(value)) return value.map((item) => hydrateOfflineMedia(item, media));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, hydrateOfflineMedia(item, media)]),
    );
  }
  return value;
}

function readPayload(): OfflinePayload {
  const element = document.getElementById("topic-generator-offline-payload");
  if (!element?.textContent) throw new Error("Offline page payload is missing.");
  const mediaElement = document.getElementById("topic-generator-offline-media");
  const media = mediaElement?.textContent
    ? JSON.parse(mediaElement.textContent) as string[]
    : [];
  return hydrateOfflineMedia(JSON.parse(element.textContent), media) as OfflinePayload;
}

function OfflinePage({ payload }: { payload: OfflinePayload }) {
  const props = payload.mode === "generated"
    ? generatedPrototypeProps(payload.pageTypeRef, payload.generationSpec)
    : payload.mode === "content"
      ? contentPrototypeProps(
          payload.pageTypeRef,
          payload.plan,
          payload.contentSpec,
          payload.retainedVisualSpec,
        )
      : selectionPrototypeProps(payload.pageTypeRef, payload.plan);
  return (
    <div data-offline-page data-offline-mode={payload.mode}>
      {payload.warnings.length > 0 && (
        <aside className="topic-generator-offline-warning" role="status">
          <strong>Draft media warning</strong>
          <ul>{payload.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </aside>
      )}
      <TopicLandingPage {...props} showChrome={payload.showChrome} />
    </div>
  );
}

const root = document.getElementById("topic-generator-offline-root");
if (!root) throw new Error("Offline page root is missing.");
const payload = readPayload();
createRoot(root).render(
  <StrictMode>
    <OfflinePage payload={payload} />
  </StrictMode>,
);
