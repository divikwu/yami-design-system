import "@yami/design-system/styles/base.css";
import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TopicLandingPage } from "@yami/prototypes/topic-landing-page";
import type { TopicPagePreviewRendererProps } from "@yami/topic-generator/web";
import {
  generatedPrototypeProps,
  selectionPrototypeProps,
} from "../app/topic-generator-workbench";

type SelectionPreview = Extract<TopicPagePreviewRendererProps, { mode: "selection" }>;
type GeneratedPreview = Extract<TopicPagePreviewRendererProps, { mode: "generated" }>;

type OfflinePayload =
  | {
      mode: "selection";
      pageTypeRef: SelectionPreview["pageTypeRef"];
      plan: SelectionPreview["plan"];
      warnings: string[];
    }
  | {
      mode: "generated";
      pageTypeRef: GeneratedPreview["pageTypeRef"];
      generationSpec: GeneratedPreview["generationSpec"];
      warnings: string[];
    };

function readPayload(): OfflinePayload {
  const element = document.getElementById("topic-generator-offline-payload");
  if (!element?.textContent) throw new Error("Offline page payload is missing.");
  return JSON.parse(element.textContent) as OfflinePayload;
}

function OfflinePage({ payload }: { payload: OfflinePayload }) {
  const props = payload.mode === "generated"
    ? generatedPrototypeProps(payload.pageTypeRef, payload.generationSpec)
    : selectionPrototypeProps(payload.pageTypeRef, payload.plan);
  return (
    <div data-offline-page data-offline-mode={payload.mode}>
      {payload.warnings.length > 0 && (
        <aside className="topic-generator-offline-warning" role="status">
          <strong>Draft media warning</strong>
          <ul>{payload.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </aside>
      )}
      <TopicLandingPage {...props} showChrome={false} />
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
