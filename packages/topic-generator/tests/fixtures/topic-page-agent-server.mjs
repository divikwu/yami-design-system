import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { deflateSync } from "node:zlib";

import { contentProposal } from "./topic-content-agent.mjs";

const port = Number(process.env.TOPIC_PAGE_AGENT_STUB_PORT ?? 4400);

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function solidPng(width, height, color) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const row = Buffer.alloc(1 + width * 4);
  row[0] = 0;
  for (let index = 0; index < width; index += 1) {
    row.set(color, 1 + index * 4);
  }
  const pixels = Buffer.alloc(row.length * height);
  for (let index = 0; index < height; index += 1) {
    row.copy(pixels, index * row.length);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function proposalResponse(stage, proposal, assets) {
  return {
    schemaVersion: "topic-page-agent-response/v1",
    stage,
    proposal,
    ...(assets ? { assets } : {}),
  };
}

function orchestrationProposal(run) {
  const context = run.context;
  const pageType = context.requestedPageTypeRef
    ? context.pageTypes.find(({ ref }) => ref === context.requestedPageTypeRef)
    : context.pageTypes.find(({ supportedThemeTypes, requiresExplicitRequest }) =>
      !requiresExplicitRequest && supportedThemeTypes.includes(context.themeIntent.themeType)
    );
  if (!pageType) throw new Error("No registered page type supports the orchestration task.");
  const route = context.requestedSelectionStrategyRef
    ? pageType.routes.find(({ selectionStrategyRef }) =>
      selectionStrategyRef === context.requestedSelectionStrategyRef
    )
    : pageType.routes[0];
  if (!route) throw new Error("No registered selection route supports the orchestration task.");
  return {
    schemaVersion: "landing-page-execution-plan-proposal/v1",
    keyword: context.keyword,
    site: context.site,
    language: context.language,
    themeIntentDigest: context.themeIntentDigest,
    requestedPageTypeRef: context.requestedPageTypeRef,
    requestedSelectionStrategyRef: context.requestedSelectionStrategyRef,
    pageTypeRef: pageType.ref,
    selectionStrategyRef: route.selectionStrategyRef,
    templateRef: route.templateRef,
    reason: "Use the registered page type and selection route requested by the caller.",
  };
}

function experienceReviewProposal(run) {
  return {
    schemaVersion: "topic-page-experience-review-proposal/v1",
    executionPlanDigest: run.context.executionPlanDigest,
    generationSpecDigest: run.context.generationSpec.digest,
    qaReportDigest: run.context.qaReport.digest,
    recommendation: "recommend-approval",
    summary: "The deterministic protocol fixture is coherent and ready for human review.",
    issues: [],
  };
}

function merchandisingProposal(run) {
  const context = run.context;
  const used = new Set();
  const modules = context.moduleRules.map((rule) => {
    if (rule.maximumProducts === 0 || (!rule.required && rule.id !== "brand-spotlight")) {
      return {
        id: rule.id,
        visible: false,
        shoppingGoal: "",
        reason: rule.id === "start-here"
          ? "No validated source scenes are available for this template."
          : "The frozen evidence does not require this optional module.",
        scenes: [],
        assignments: [],
      };
    }
    if (rule.id === "brand-spotlight") {
      return {
        id: rule.id,
        visible: false,
        shoppingGoal: "",
        reason: "Brand spotlight stays hidden in the protocol fixture.",
        scenes: [],
        assignments: [],
      };
    }
    const eligible = context.products.filter((product) =>
      rule.allowedPools.includes(product.pool) && rule.allowedRoles.includes(product.role)
    );
    const preferred = rule.id === "hero" ? 2 : rule.id === "shortcuts" ? 4 : 6;
    const count = Math.min(rule.maximumProducts, Math.max(rule.minimumProducts, preferred), eligible.length);
    const assignments = eligible.slice(0, count).map((product) => {
      const reused = used.has(product.id);
      used.add(product.id);
      return {
        productId: product.id,
        ...(reused
          ? { reuseReason: "This frozen product also supports the distinct goal of this module." }
          : {}),
      };
    });
    return {
      id: rule.id,
      visible: true,
      shoppingGoal: `Help shoppers complete the ${rule.id} task for ${context.keyword}.`,
      reason: "Assignments use only eligible products from the frozen selection result.",
      scenes: [],
      assignments,
    };
  });
  return {
    schemaVersion: "module-merchandising-proposal/v1",
    keyword: context.keyword,
    site: context.site,
    strategyRef: context.strategyRef,
    templateRef: context.templateRef,
    themeIntentDigest: context.themeIntentDigest,
    productSelectionDigest: context.productSelectionDigest,
    moduleOrder: context.moduleOrder,
    modules,
  };
}

function visualOutput(run) {
  const context = run.context;
  const runRef = context.topicPagePlanDigest.replace("sha256:", "").slice(0, 12);
  const colors = [
    [205, 221, 196, 255],
    [226, 211, 179, 255],
    [194, 214, 221, 255],
    [225, 198, 197, 255],
  ];
  const bodies = [];
  const assets = context.tasks.map((task, index) => {
    const width = task.targetAspectRatio === "16:9"
      ? 1200
      : task.targetAspectRatio === "111:40" ? 888 : task.minimumWidth;
    const height = task.targetAspectRatio === "16:9"
      ? 675
      : task.targetAspectRatio === "111:40" ? 320 : task.minimumHeight;
    const bytes = solidPng(width, height, colors[index % colors.length]);
    const ref = `assets/${runRef}/${task.taskId}.png`;
    const evidenceRef = `product:${task.products[0].id}`;
    bodies.push({
      taskId: task.taskId,
      ref,
      mimeType: "image/png",
      dataBase64: bytes.toString("base64"),
    });
    return {
      taskId: task.taskId,
      moduleId: task.moduleId,
      component: task.component,
      kind: task.kind,
      direction: {
        prompt: `Catalog-grounded ${context.keyword} scene for ${task.kind}.`,
        evidenceRefs: [evidenceRef, `content-task:${task.contentTask.taskId}`],
        referenceProductIds: task.products.map(({ id }) => id),
      },
      altText: task.altTextMode === "decorative"
        ? null
        : {
            language: context.language,
            text: context.language === "zh" ? `${context.keyword} 主题场景` : `${context.keyword} topic scene`,
            evidenceRefs: [evidenceRef],
          },
      artifact: {
        ref,
        mimeType: "image/png",
        width,
        height,
        digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
        focalPoint: { x: 0.5, y: 0.5 },
        ...(task.requiresBackgroundColor ? { backgroundColor: "#cdddc4" } : {}),
      },
    };
  });
  return {
    proposal: {
      schemaVersion: "topic-page-visual-proposal/v1",
      keyword: context.keyword,
      site: context.site,
      language: context.language,
      topicPagePlanDigest: context.topicPagePlanDigest,
      topicPageContentSpecDigest: context.topicPageContentSpecDigest,
      themeIntentDigest: context.themeIntentDigest,
      productSelectionDigest: context.productSelectionDigest,
      assets,
    },
    bodies,
  };
}

const server = createServer((request, response) => {
  if (request.method !== "POST") {
    response.writeHead(405).end();
    return;
  }
  const chunks = [];
  let size = 0;
  request.on("data", (chunk) => {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) request.destroy();
    else chunks.push(chunk);
  });
  request.on("end", () => {
    try {
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      let result;
      if (payload.stage === "workflow-planning") {
        result = proposalResponse(payload.stage, orchestrationProposal(payload.run));
      } else if (payload.stage === "module-merchandising") {
        result = proposalResponse(payload.stage, merchandisingProposal(payload.run));
      } else if (payload.stage === "content-writing") {
        result = proposalResponse(payload.stage, contentProposal(payload.run));
      } else if (payload.stage === "visual-generation") {
        const visual = visualOutput(payload.run);
        result = proposalResponse(payload.stage, visual.proposal, visual.bodies);
      } else if (payload.stage === "experience-review") {
        result = proposalResponse(payload.stage, experienceReviewProposal(payload.run));
      } else {
        throw new Error("Unsupported stage.");
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request." }));
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Topic Page Agent protocol fixture listening on http://127.0.0.1:${port}\n`);
});
