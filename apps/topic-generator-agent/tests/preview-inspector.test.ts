import { access, readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import { inspectExperienceReviewPreviews } from "../src/preview-inspector.ts";

const digest = `sha256:${"a".repeat(64)}`;

function reviewRun(desktop = "http://127.0.0.1:3300/review/desktop") {
  return {
    stage: "experience-review",
    run: {
      context: {
        generationSpec: { digest },
        previewRefs: {
          desktop,
          mobile: "http://127.0.0.1:3300/review/mobile",
        },
      },
    },
  };
}

function browserFixture(options: {
  marker?: string;
  finalUrl?: string;
  failScreenshotAt?: number;
} = {}) {
  const pages: Array<{ viewport: unknown; screenshotPath?: string }> = [];
  let screenshotCount = 0;
  const browser = {
    newContext: vi.fn(async ({ viewport }: { viewport: unknown }) => ({
      newPage: vi.fn(async () => {
        const state: { url: string; screenshotPath?: string } = { url: "about:blank" };
        const pageRecord: { viewport: unknown; screenshotPath?: string } = { viewport };
        pages.push(pageRecord);
        return {
          goto: vi.fn(async (url: string) => {
            state.url = options.finalUrl ?? url;
          }),
          url: vi.fn(() => state.url),
          emulateMedia: vi.fn(async () => undefined),
          locator: vi.fn(() => ({
            count: vi.fn(async () => 1),
            first: vi.fn(() => ({
              waitFor: vi.fn(async () => undefined),
              getAttribute: vi.fn(async () => options.marker ?? digest),
            })),
          })),
          evaluate: vi.fn(async () => undefined),
          screenshot: vi.fn(async ({ path }: { path: string }) => {
            screenshotCount += 1;
            if (screenshotCount === options.failScreenshotAt) throw new Error("screenshot failed");
            state.screenshotPath = path;
            pageRecord.screenshotPath = path;
            await import("node:fs/promises").then(({ writeFile }) => writeFile(path, "png"));
          }),
        };
      }),
      close: vi.fn(async () => undefined),
    })),
    close: vi.fn(async () => undefined),
  };
  return { browser, pages };
}

describe("experience review preview inspector", () => {
  it("captures generation-bound desktop and mobile previews", async () => {
    const fixture = browserFixture();
    const result = await inspectExperienceReviewPreviews(reviewRun(), {
      launchBrowser: async () => fixture.browser,
    });

    expect(fixture.browser.newContext).toHaveBeenNthCalledWith(1, {
      viewport: { width: 1440, height: 1000 },
    });
    expect(fixture.browser.newContext).toHaveBeenNthCalledWith(2, {
      viewport: { width: 390, height: 844 },
    });
    expect(result.attachments.map(({ label }) => label)).toEqual([
      "experience-review-desktop",
      "experience-review-mobile",
    ]);
    await Promise.all(result.attachments.map(async ({ path }) => {
      await access(path);
      expect(await readFile(path, "utf8")).toBe("png");
    }));

    const paths = result.attachments.map(({ path }) => path);
    await result.cleanup();
    await Promise.all(paths.map((path) => expect(access(path)).rejects.toThrow()));
    expect(fixture.browser.close).toHaveBeenCalledOnce();
  });

  it("rejects relative and cross-origin preview URLs before launching a browser", async () => {
    const launchBrowser = vi.fn();
    await expect(inspectExperienceReviewPreviews(reviewRun("/review/desktop"), {
      launchBrowser,
    })).rejects.toMatchObject({ code: "preview_ref_invalid" });
    await expect(inspectExperienceReviewPreviews(
      reviewRun("https://example.com/review/desktop"),
      { launchBrowser },
    )).rejects.toMatchObject({ code: "preview_origin_not_allowed" });
    expect(launchBrowser).not.toHaveBeenCalled();
  });

  it("rejects a final cross-origin redirect and removes capture artifacts", async () => {
    const fixture = browserFixture({ finalUrl: "https://example.com/redirected" });
    await expect(inspectExperienceReviewPreviews(reviewRun(), {
      launchBrowser: async () => fixture.browser,
    })).rejects.toMatchObject({ code: "preview_redirect_not_allowed" });
    expect(fixture.browser.close).toHaveBeenCalledOnce();
  });

  it("fails closed on a stale generation marker", async () => {
    const fixture = browserFixture({ marker: `sha256:${"b".repeat(64)}` });
    await expect(inspectExperienceReviewPreviews(reviewRun(), {
      launchBrowser: async () => fixture.browser,
    })).rejects.toMatchObject({ code: "generation_marker_mismatch" });
    expect(fixture.browser.close).toHaveBeenCalledOnce();
  });

  it("removes the first screenshot when the second screenshot fails", async () => {
    const fixture = browserFixture({ failScreenshotAt: 2 });
    await expect(inspectExperienceReviewPreviews(reviewRun(), {
      launchBrowser: async () => fixture.browser,
    })).rejects.toMatchObject({ code: "preview_capture_failed" });
    const firstScreenshot = fixture.pages[0]?.screenshotPath;
    expect(firstScreenshot).toBeTypeOf("string");
    await expect(access(firstScreenshot!)).rejects.toThrow();
    expect(fixture.browser.close).toHaveBeenCalledOnce();
  });
});
