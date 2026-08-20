import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";

interface PageLike {
  goto(url: string, options: { waitUntil: "networkidle"; timeout: number }): Promise<unknown>;
  url(): string;
  emulateMedia(options: { reducedMotion: "reduce" }): Promise<unknown>;
  locator(selector: string): {
    count(): Promise<number>;
    first(): {
      waitFor(options: { state: "visible"; timeout: number }): Promise<unknown>;
      getAttribute(name: string): Promise<string | null>;
    };
  };
  evaluate(pageFunction: () => Promise<void>): Promise<unknown>;
  screenshot(options: { path: string; fullPage: true; type: "png" }): Promise<unknown>;
}

interface BrowserContextLike {
  newPage(): Promise<PageLike>;
  close(): Promise<unknown>;
}

interface BrowserLike {
  newContext(options: {
    viewport: { width: number; height: number };
  }): Promise<BrowserContextLike>;
  close(): Promise<unknown>;
}

export interface PreviewInspectionAttachment {
  path: string;
  label: "experience-review-desktop" | "experience-review-mobile";
}

export interface PreviewInspectionResult {
  attachments: PreviewInspectionAttachment[];
  cleanup(): Promise<void>;
}

export interface PreviewInspectorOptions {
  allowedOrigin?: string;
  outputDirectory?: string;
  timeoutMs?: number;
  launchBrowser?: () => Promise<BrowserLike>;
}

export class PreviewInspectionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PreviewInspectionError";
    this.code = code;
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function requiredAbsoluteUrl(value: unknown, allowedOrigin: string, label: string) {
  if (typeof value !== "string") {
    throw new PreviewInspectionError("preview_ref_invalid", `${label} preview URL is missing.`);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PreviewInspectionError("preview_ref_invalid", `${label} preview URL must be absolute.`);
  }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.origin !== allowedOrigin) {
    throw new PreviewInspectionError(
      "preview_origin_not_allowed",
      `${label} preview URL must use the allowed HTTP origin.`,
    );
  }
  return url;
}

function inspectionInput(input: unknown, allowedOrigin: string) {
  const body = asObject(input);
  const run = asObject(body?.run);
  const context = asObject(run?.context);
  const generationSpec = asObject(context?.generationSpec);
  const previewRefs = asObject(context?.previewRefs);
  const digest = generationSpec?.digest;
  if (body?.stage !== "experience-review" || typeof digest !== "string" || !digest.trim()) {
    throw new PreviewInspectionError(
      "preview_context_invalid",
      "Experience review requires a generation digest.",
    );
  }
  return {
    digest,
    desktop: requiredAbsoluteUrl(previewRefs?.desktop, allowedOrigin, "Desktop"),
    mobile: requiredAbsoluteUrl(previewRefs?.mobile, allowedOrigin, "Mobile"),
  };
}

function allowedOrigin(value: string | undefined) {
  let url: URL;
  try {
    url = new URL(value ?? "http://127.0.0.1:3300");
  } catch {
    throw new PreviewInspectionError("allowed_origin_invalid", "Allowed preview origin is invalid.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new PreviewInspectionError(
      "allowed_origin_invalid",
      "Allowed preview origin must use HTTP or HTTPS.",
    );
  }
  return url.origin;
}

export async function inspectExperienceReviewPreviews(
  input: unknown,
  options: PreviewInspectorOptions = {},
): Promise<PreviewInspectionResult> {
  const origin = allowedOrigin(options.allowedOrigin);
  const previews = inspectionInput(input, origin);
  const timeoutMs = options.timeoutMs ?? 30_000;
  const ownsDirectory = !options.outputDirectory;
  const directory = options.outputDirectory
    ? options.outputDirectory
    : await mkdtemp(join(tmpdir(), "yami-topic-review-"));
  if (options.outputDirectory) await mkdir(directory, { recursive: true });
  const suffix = randomUUID();
  const attachments: PreviewInspectionAttachment[] = [
    { path: join(directory, `desktop-${suffix}.png`), label: "experience-review-desktop" },
    { path: join(directory, `mobile-${suffix}.png`), label: "experience-review-mobile" },
  ];
  const cleanup = async () => {
    if (ownsDirectory) {
      await rm(directory, { recursive: true, force: true });
      return;
    }
    await Promise.all(attachments.map(({ path }) => rm(path, { force: true })));
  };
  let browser: BrowserLike | undefined;
  try {
    browser = await (options.launchBrowser?.() ?? chromium.launch({ headless: true }));
    const targets = [
      { url: previews.desktop, viewport: { width: 1440, height: 1000 }, attachment: attachments[0]! },
      { url: previews.mobile, viewport: { width: 390, height: 844 }, attachment: attachments[1]! },
    ];
    for (const target of targets) {
      const context = await browser.newContext({ viewport: target.viewport });
      try {
        const page = await context.newPage();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(target.url.href, { waitUntil: "networkidle", timeout: timeoutMs });
        const finalUrl = new URL(page.url());
        if (finalUrl.origin !== origin) {
          throw new PreviewInspectionError(
            "preview_redirect_not_allowed",
            `${target.attachment.label} redirected outside the allowed origin.`,
          );
        }
        const marker = page.locator("[data-generation-spec]");
        if (await marker.count() < 1) {
          throw new PreviewInspectionError(
            "generation_marker_missing",
            `${target.attachment.label} has no generation marker.`,
          );
        }
        const firstMarker = marker.first();
        await firstMarker.waitFor({ state: "visible", timeout: timeoutMs });
        if (await firstMarker.getAttribute("data-generation-spec") !== previews.digest) {
          throw new PreviewInspectionError(
            "generation_marker_mismatch",
            `${target.attachment.label} does not match the requested generation.`,
          );
        }
        await page.evaluate(async () => {
          await document.fonts?.ready;
          await new Promise<void>((resolve) => requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve())
          ));
        });
        await page.screenshot({ path: target.attachment.path, fullPage: true, type: "png" });
      } finally {
        await context.close();
      }
    }
    await browser.close();
    browser = undefined;
    return { attachments, cleanup };
  } catch (error) {
    if (browser) await browser.close().catch(() => undefined);
    await cleanup();
    if (error instanceof PreviewInspectionError) throw error;
    throw new PreviewInspectionError(
      "preview_capture_failed",
      error instanceof Error ? error.message : "Preview capture failed.",
    );
  }
}
