import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const storyPath =
  "iframe.html?id=yami-pages-ecommerce-home--pc&viewMode=story&globals=locale:zh;theme:light";
const viewports = [
  { name: "mobile", width: 402, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
];

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const baselineUrl = option(
  "baseline-url",
  process.env.ECOMMERCE_HOME_BASELINE_URL,
);
const candidateUrl = option(
  "candidate-url",
  process.env.ECOMMERCE_HOME_CANDIDATE_URL,
);
const outputPath = path.resolve(
  option("output", "test-results/ecommerce-home-image-performance.json"),
);

if (!baselineUrl || !candidateUrl) {
  throw new Error(
    "Pass --baseline-url and --candidate-url (or ECOMMERCE_HOME_BASELINE_URL and ECOMMERCE_HOME_CANDIDATE_URL).",
  );
}

function storyUrl(baseUrl) {
  return `${baseUrl.replace(/\/$/, "")}/${storyPath}`;
}

function summarize(records) {
  const resources = Array.from(
    records.reduce((byUrl, record) => {
      const current = byUrl.get(record.url) ?? { requests: 0, bytes: 0 };
      current.requests += 1;
      current.bytes += record.bytes;
      byUrl.set(record.url, current);
      return byUrl;
    }, new Map()),
    ([url, totals]) => ({
      resource: new URL(url).pathname,
      ...totals,
    }),
  ).sort((left, right) => right.bytes - left.bytes);

  return {
    requests: records.length,
    bytes: records.reduce((total, record) => total + record.bytes, 0),
    resources,
  };
}

async function settle(page) {
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
  await page.waitForTimeout(1_000);
}

async function visibleRasterQuality(page) {
  return page.evaluate((dpr) => {
    function candidatesFor(image) {
      const declarations = [
        image.getAttribute("srcset"),
        ...Array.from(
          image.closest("picture")?.querySelectorAll("source") ?? [],
        ).map((source) => source.getAttribute("srcset")),
      ].filter(Boolean);
      return declarations.flatMap((declaration) =>
        Array.from(declaration.matchAll(/(\S+)\s+(\d+)w/g)).flatMap(
          (match) => {
            return match
              ? [
                  {
                    url: new URL(match[1], location.href).href,
                    width: Number(match[2]),
                  },
                ]
              : [];
          },
        ),
      );
    }

    return Array.from(document.images).flatMap((image) => {
      const rect = image.getBoundingClientRect();
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        rect.bottom <= 0 ||
        rect.top >= innerHeight ||
        rect.right <= 0 ||
        rect.left >= innerWidth
      ) {
        return [];
      }
      const currentSrc = image.currentSrc || image.src;
      if (!currentSrc) {
        return [{ alt: image.alt, reason: "missing-source" }];
      }
      if (
        /\.svg(?:$|\?)/i.test(currentSrc) ||
        currentSrc.startsWith("data:image/svg")
      ) {
        return [];
      }
      const candidate = candidatesFor(image).find(
        (entry) => entry.url === currentSrc,
      );
      const selectedWidth = candidate?.width ?? image.naturalWidth;
      const requiredWidth = rect.width * dpr;
      return selectedWidth + 1 < requiredWidth
        ? [
            {
              alt: image.alt,
              currentSrc: currentSrc.startsWith("data:")
                ? currentSrc.slice(0, currentSrc.indexOf(",") + 1)
                : currentSrc,
              cssWidth: Number(rect.width.toFixed(2)),
              selectedWidth,
              requiredWidth: Number(requiredWidth.toFixed(2)),
              reason: "below-native-dpr",
            },
          ]
        : [];
    });
  }, 2);
}

async function measure(browser, baseUrl, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await context.addInitScript(() => {
    window.__imagePerformance = { cls: 0, lcp: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__imagePerformance.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1);
      if (entry) window.__imagePerformance.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

  const records = [];
  const pendingResponses = [];
  page.on("response", (response) => {
    const contentType = response.headers()["content-type"] ?? "";
    if (
      response.request().resourceType() !== "image" &&
      !contentType.startsWith("image/")
    ) {
      return;
    }
    const pending = response
      .body()
      .then((body) => {
        records.push({ url: response.url(), bytes: body.byteLength });
      })
      .catch(() => {});
    pendingResponses.push(pending);
  });

  try {
    await page.goto(storyUrl(baseUrl), {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page
      .locator('[data-slot="ecommerce-home"]')
      .waitFor({ state: "visible", timeout: 30_000 });
    await settle(page);
    await Promise.allSettled(pendingResponses);
    const firstRecordCount = records.length;
    const firstViewport = summarize(records.slice(0, firstRecordCount));
    const firstQualityFailures = await visibleRasterQuality(page);

    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await settle(page);
    await Promise.allSettled(pendingResponses);
    const secondViewportDelta = summarize(records.slice(firstRecordCount));
    const firstTwoViewports = summarize(records);
    const secondQualityFailures = await visibleRasterQuality(page);
    const vitals = await page.evaluate(() => window.__imagePerformance);

    return {
      viewport,
      firstViewport,
      secondViewportDelta,
      firstTwoViewports,
      cls: Number(vitals.cls.toFixed(4)),
      lcp: Math.round(vitals.lcp),
      qualityFailures: [...firstQualityFailures, ...secondQualityFailures],
    };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
const report = {
  baselineUrl,
  candidateUrl,
  deviceScaleFactor: 2,
  results: [],
};
try {
  for (const viewport of viewports) {
    const baseline = await measure(browser, baselineUrl, viewport);
    const candidate = await measure(browser, candidateUrl, viewport);
    const requestRatio =
      candidate.firstTwoViewports.requests /
      Math.max(1, baseline.firstTwoViewports.requests);
    const byteRatio =
      candidate.firstTwoViewports.bytes /
      Math.max(1, baseline.firstTwoViewports.bytes);
    report.results.push({
      viewport: viewport.name,
      baseline,
      candidate,
      requestRatio: Number(requestRatio.toFixed(4)),
      byteRatio: Number(byteRatio.toFixed(4)),
    });
  }
} finally {
  await browser.close();
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

const failures = [];
for (const result of report.results) {
  if (result.requestRatio > 0.5) {
    failures.push(
      `${result.viewport}: image request ratio ${result.requestRatio} > 0.5`,
    );
  }
  if (result.byteRatio > 0.5) {
    failures.push(
      `${result.viewport}: image byte ratio ${result.byteRatio} > 0.5`,
    );
  }
  if (
    result.candidate.cls > 0.1 ||
    result.candidate.cls > result.baseline.cls
  ) {
    failures.push(
      `${result.viewport}: CLS ${result.candidate.cls} exceeds 0.1 or baseline ${result.baseline.cls}`,
    );
  }
  if (result.candidate.qualityFailures.length > 0) {
    failures.push(
      `${result.viewport}: ${result.candidate.qualityFailures.length} visible raster images lack native DPR coverage`,
    );
  }
}

console.log(
  JSON.stringify(
    {
      results: report.results.map((result) => ({
        viewport: result.viewport,
        baseline: {
          requests: result.baseline.firstTwoViewports.requests,
          bytes: result.baseline.firstTwoViewports.bytes,
        },
        candidate: {
          requests: result.candidate.firstTwoViewports.requests,
          bytes: result.candidate.firstTwoViewports.bytes,
        },
        requestRatio: result.requestRatio,
        byteRatio: result.byteRatio,
        cls: {
          baseline: result.baseline.cls,
          candidate: result.candidate.cls,
        },
        lcp: {
          baseline: result.baseline.lcp,
          candidate: result.candidate.lcp,
        },
        qualityFailures: result.candidate.qualityFailures.length,
      })),
    },
    null,
    2,
  ),
);
console.log(`Wrote ${path.relative(process.cwd(), outputPath)}.`);
if (failures.length > 0) {
  throw new Error(failures.join("\n"));
}
