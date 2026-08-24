import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type {
  TopicAudienceContext,
  TopicBackgroundEvidenceBundle,
} from "../background-evidence/contracts.js";
import type {
  TopicPageContentCandidateDirection,
  TopicPageContentCandidateGenerationContext,
  TopicPageContentCandidateModuleId,
  TopicPageContentCandidateSelectionCriterion,
  TopicPageContentCandidateSelectionDecision,
  TopicPageContentCandidateSelectionProposal,
  TopicPageContentCandidateSelectionRun,
  TopicPageContentCandidateSet,
  TopicPageContentContext,
  TopicPageContentProposal,
  TopicPageContentTaskProposal,
} from "./contracts.js";
import { advanceTopicPageContentRun } from "./run.js";

export const TOPIC_PAGE_CONTENT_CANDIDATE_DIRECTIONS = [
  {
    id: "candidate-1",
    focus: "topic-proposition",
    objective: "Lead with the strongest evidence-supported topic proposition, then give Start Here a matching decision path.",
  },
  {
    id: "candidate-2",
    focus: "routine-entry",
    objective: "Frame the topic through a useful routine entry without turning the Hero into procedural page instructions.",
  },
  {
    id: "candidate-3",
    focus: "shopping-decision",
    objective: "Lead with one concrete shopper decision and let the assigned scenes resolve distinct choices.",
  },
  {
    id: "candidate-4",
    focus: "scene-journey",
    objective: "Use the supported scenes to create an experience-led proposition without listing the page structure.",
  },
  {
    id: "candidate-5",
    focus: "guided-discovery",
    objective: "Offer an inviting editorial discovery angle that remains specific to the topic and useful to a newcomer.",
  },
] as const satisfies readonly TopicPageContentCandidateDirection[];

const BRAND_CANDIDATE_DIRECTIONS = [
  {
    id: "candidate-1",
    focus: "brand-position",
    objective: "Create a compact brand-positioning capsule for a newcomer: combine the canonical brand name with supported category or identity context and the strongest evidence-backed distinction or shopper value across the Hero pair. When natural, let the headline itself state the brand, category or identity, and distinction instead of hiding them behind abstract wrapper labels such as brand promise, concept, approach, 主张, 构思, or 视角. A colon is optional, and identity should orient rather than stand alone as the proposition. Use the description to translate the distinction into two or three supported shopper needs or choice benefits rather than a category inventory.",
  },
  {
    id: "candidate-2",
    focus: "signature-concept",
    objective: "Build the Hero around the most distinctive brand-defined concept, terminology, or signature ingredient explicitly supported by eligible evidence, not catalog navigation.",
  },
  {
    id: "candidate-3",
    focus: "routine-role",
    objective: "Show a useful role for the brand within a routine while keeping the Hero brand-specific and avoiding a category inventory.",
  },
  {
    id: "candidate-4",
    focus: "need-led-choice",
    objective: "Connect the brand to one supported shopper need or decision; let Start Here resolve the individual scene choices.",
  },
  {
    id: "candidate-5",
    focus: "editorial-discovery",
    objective: "Create an inviting editorial brand proposition without interface language such as browse entry, start by category, or view formats.",
  },
] as const satisfies readonly TopicPageContentCandidateDirection[];

const BRAND_TITLE_ANCHOR_PREFERENCE =
  "When it reads naturally, include the canonical brand name once in the Hero headline and let the complete pair answer what the brand is, what distinguishes it, and why it matters to the shopper. When one precise category clearly represents the brand and is supported, prefer that category in the headline. For a multi-category brand, do not falsely narrow it; prefer the narrowest accurate supported umbrella category or identity. If no umbrella identity is supported, keep the brand and distinction in the headline and leave representative category breadth to the description, tags, and category navigation instead of inventing an identity or enumerating the taxonomy. Prefer distinct supported tag axes such as signature concept or ingredient, formulation or position, and shopper need or category. These are editorial preferences, never validity requirements.";

const SELECTION_CRITERIA = [
  "newcomer-orientation",
  "theme-specificity",
  "scene-specificity",
  "shopping-decision-usefulness",
  "module-differentiation",
  "evidence-claim-alignment",
  "language-quality",
  "locale-naturalness",
  "topic-anchor-visibility",
  "cross-module-coherence",
  "consumer-relevance",
  "editorial-quality",
  "meta-navigation-avoidance",
  "module-redundancy-avoidance",
] as const satisfies readonly TopicPageContentCandidateSelectionCriterion[];

const ADVISORY_SELECTION_CRITERIA = [
  "evidence-claim-alignment",
  "language-quality",
  "locale-naturalness",
  "topic-anchor-visibility",
  "consumer-relevance",
  "meta-navigation-avoidance",
  "module-redundancy-avoidance",
] as const satisfies readonly TopicPageContentCandidateSelectionCriterion[];

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function exactOrder(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function taskId(value: unknown) {
  return stringValue(objectValue(value)?.taskId);
}

function moduleId(value: unknown) {
  return stringValue(objectValue(value)?.moduleId);
}

export function topicPageContentCandidateGeneration(
  context: TopicPageContentContext,
): TopicPageContentCandidateGenerationContext | null {
  const available = new Set(context.tasks.map(({ moduleId }) => moduleId));
  const targetModuleIds = (["hero", "start-here"] as const).filter((id) => available.has(id));
  if (targetModuleIds.length === 0) return null;
  const brandBrief = context.copyBrief.schemaVersion === "topic-page-copy-brief/v3" &&
    context.copyBrief.heroStrategy.kind === "brand";
  const directions = brandBrief
    ? BRAND_CANDIDATE_DIRECTIONS
    : TOPIC_PAGE_CONTENT_CANDIDATE_DIRECTIONS;
  return {
    schemaVersion: "topic-page-content-candidate-generation/v1",
    candidateCount: 5,
    targetModuleIds,
    directions: directions.map((direction) => ({
      ...direction,
      objective: brandBrief
        ? `${direction.objective} ${BRAND_TITLE_ANCHOR_PREFERENCE}`
        : direction.objective,
    })),
    selectionUnit: "module-package-with-optional-scene-picks",
    sharedTaskPolicy: "generate-once-preserve-exactly",
  };
}

interface CandidateSetReviewRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  language: ContentLanguage;
  audienceContext?: TopicAudienceContext;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  generation: TopicPageContentCandidateGenerationContext;
  value: unknown;
}

export function reviewTopicPageContentCandidateSet(
  request: CandidateSetReviewRequest,
): { candidateSet?: TopicPageContentCandidateSet; issues: string[] } {
  const value = objectValue(request.value);
  const issues: string[] = [];
  if (!value) {
    return { issues: ["TopicPageContentCandidateSetProposal must be a JSON object."] };
  }
  if (value.schemaVersion !== "topic-page-content-candidate-set-proposal/v1") {
    issues.push('schemaVersion must be "topic-page-content-candidate-set-proposal/v1".');
  }
  if (value.keyword !== request.plan.keyword) {
    issues.push("Candidate set keyword does not match TopicPagePlan.");
  }
  if (value.site !== request.plan.site) {
    issues.push("Candidate set site does not match TopicPagePlan.");
  }
  if (value.language !== request.language) {
    issues.push("Candidate set language does not match the requested content language.");
  }
  if (value.topicPagePlanDigest !== request.plan.digest) {
    issues.push("Candidate set topicPagePlanDigest does not match TopicPagePlan.");
  }
  if (value.themeIntentDigest !== request.plan.themeIntentDigest) {
    issues.push("Candidate set themeIntentDigest does not match TopicPagePlan.");
  }
  if (value.productSelectionDigest !== request.plan.productSelectionDigest) {
    issues.push("Candidate set productSelectionDigest does not match TopicPagePlan.");
  }

  const targetModuleIds = Array.isArray(value.targetModuleIds)
    ? value.targetModuleIds.map(stringValue)
    : [];
  if (!exactOrder(targetModuleIds, request.generation.targetModuleIds)) {
    issues.push("Candidate set targetModuleIds must match the requested module packages.");
  }
  const sharedTasks = Array.isArray(value.sharedTasks) ? value.sharedTasks : [];
  if (!Array.isArray(value.sharedTasks)) {
    issues.push("Candidate set sharedTasks must be an array.");
  }
  const targetSet = new Set(request.generation.targetModuleIds);
  const expectedTaskBindings = request.plan.modules
    .filter(({ visible, contentTaskId }) => visible && contentTaskId)
    .map(({ id, contentTaskId }) => ({ moduleId: id, taskId: contentTaskId! }));
  const expectedTaskOrder = expectedTaskBindings.map(({ taskId }) => taskId);
  const expectedSharedBindings = expectedTaskBindings.filter(({ moduleId }) =>
    !targetSet.has(moduleId as TopicPageContentCandidateModuleId)
  );
  if (!exactOrder(
    sharedTasks.map(taskId),
    expectedSharedBindings.map(({ taskId: expectedTaskId }) => expectedTaskId),
  ) || !exactOrder(
    sharedTasks.map(moduleId),
    expectedSharedBindings.map(({ moduleId: expectedModuleId }) => expectedModuleId),
  )) {
    issues.push("Candidate set sharedTasks must contain every non-target task exactly once in PagePlan order.");
  }
  if (sharedTasks.some((task) => targetSet.has(moduleId(task) as TopicPageContentCandidateModuleId))) {
    issues.push("Candidate set sharedTasks cannot contain a target module.");
  }

  const rawCandidates = Array.isArray(value.candidates) ? value.candidates : [];
  if (!Array.isArray(value.candidates) || rawCandidates.length !== 5) {
    issues.push("Candidate set must define exactly 5 candidates.");
  }
  const acceptedCandidates: TopicPageContentCandidateSet["candidates"] = [];
  const candidateTaskDigests = new Set<string>();
  const advisoryWarnings: string[] = [];
  let acceptedSharedTasks: TopicPageContentTaskProposal[] | undefined;
  const expectedTargetTaskIds = request.generation.targetModuleIds.map((expectedModuleId) =>
    expectedTaskBindings.find(({ moduleId: candidateModuleId }) =>
      candidateModuleId === expectedModuleId
    )?.taskId ?? ""
  );

  rawCandidates.forEach((rawCandidate, index) => {
    const candidate = objectValue(rawCandidate);
    const expectedDirection = request.generation.directions[index];
    if (!candidate || !expectedDirection) {
      issues.push(`Candidate ${index + 1} must be an object in the requested order.`);
      return;
    }
    const id = stringValue(candidate.id);
    const directionId = stringValue(candidate.directionId);
    if (id !== expectedDirection.id || directionId !== expectedDirection.id) {
      issues.push(`Candidate ${index + 1} must use direction ${expectedDirection.id}.`);
    }
    const candidateTasks = Array.isArray(candidate.tasks) ? candidate.tasks : [];
    if (!Array.isArray(candidate.tasks)) {
      issues.push(`Candidate ${id || index + 1} tasks must be an array.`);
    }
    const candidateModuleIds = candidateTasks.map(moduleId);
    if (!exactOrder(candidateModuleIds, request.generation.targetModuleIds)) {
      issues.push(`Candidate ${id || index + 1} must define each target module package once.`);
    }
    if (!exactOrder(candidateTasks.map(taskId), expectedTargetTaskIds)) {
      issues.push(`Candidate ${id || index + 1} task IDs must match the target PagePlan tasks.`);
    }
    const combinedTasks = [...sharedTasks, ...candidateTasks];
    const orderedTasks = expectedTaskOrder.map((expectedTaskId) =>
      combinedTasks.find((task) => taskId(task) === expectedTaskId)
    ).filter((task) => task !== undefined) as TopicPageContentTaskProposal[];
    const proposal: TopicPageContentProposal = {
      schemaVersion: "topic-page-content-proposal/v1",
      keyword: request.plan.keyword,
      site: request.plan.site,
      language: request.language,
      topicPagePlanDigest: request.plan.digest,
      themeIntentDigest: request.plan.themeIntentDigest,
      productSelectionDigest: request.plan.productSelectionDigest,
      tasks: orderedTasks,
    };
    const reviewed = advanceTopicPageContentRun({
      intent: request.intent,
      selection: request.selection,
      plan: request.plan,
      language: request.language,
      audienceContext: request.audienceContext,
      backgroundEvidence: request.backgroundEvidence,
      proposal,
    });
    if (reviewed.status !== "ready") {
      const candidateIssues = reviewed.status === "blocked"
        ? reviewed.issues
        : ["Candidate did not compile to a ContentSpec."];
      issues.push(...candidateIssues.map((issue) => `Candidate ${id || index + 1}: ${issue}`));
      return;
    }
    const acceptedTargetTasks = reviewed.spec.tasks.filter(({ moduleId }) => targetSet.has(
      moduleId as TopicPageContentCandidateModuleId,
    ));
    const candidateTaskDigest = sha256Digest(acceptedTargetTasks);
    if (candidateTaskDigests.has(candidateTaskDigest)) {
      advisoryWarnings.push(
        `Candidate ${id || index + 1} duplicates an earlier target-module package.`,
      );
    }
    candidateTaskDigests.add(candidateTaskDigest);
    acceptedSharedTasks ??= reviewed.spec.tasks.filter(({ moduleId }) => !targetSet.has(
      moduleId as TopicPageContentCandidateModuleId,
    ));
    acceptedCandidates.push({
      id: expectedDirection.id,
      directionId: expectedDirection.id,
      direction: { ...expectedDirection },
      tasks: acceptedTargetTasks,
    });
  });

  if (issues.length > 0 || acceptedCandidates.length !== 5 || !acceptedSharedTasks) {
    return { issues };
  }
  const candidateSetBase = {
    schemaVersion: "topic-page-content-candidate-set/v1" as const,
    keyword: request.plan.keyword,
    site: request.plan.site,
    language: request.language,
    topicPagePlanDigest: request.plan.digest,
    themeIntentDigest: request.plan.themeIntentDigest,
    productSelectionDigest: request.plan.productSelectionDigest,
    targetModuleIds: [...request.generation.targetModuleIds],
    taskOrder: expectedTaskOrder,
    advisoryWarnings,
    sharedTasks: acceptedSharedTasks,
    candidates: acceptedCandidates,
  };
  return {
    issues: [],
    candidateSet: {
      ...candidateSetBase,
      digest: sha256Digest(candidateSetBase),
    },
  };
}

export interface TopicPageContentCandidateSelectorAgent {
  id: string;
  selectorAgentId?: string;
  selectPageContentCandidates(
    run: Extract<
      TopicPageContentCandidateSelectionRun,
      { status: "needs-candidate-selection-proposal" }
    >,
  ): Promise<unknown>;
}

function selectedProposal(
  candidateSet: TopicPageContentCandidateSet,
  selections: TopicPageContentCandidateSelectionProposal["selections"],
): TopicPageContentProposal {
  const selectedTasks = selections.flatMap(({ moduleId, candidateId, sceneSelections }) => {
    const selectedTask = candidateSet.candidates.find(({ id }) => id === candidateId)?.tasks
      .find((task) => task.moduleId === moduleId);
    if (!selectedTask) return [];
    const task = structuredClone(selectedTask);
    if (moduleId !== "start-here" || !task.copy.scenes || !sceneSelections?.length) {
      return [task];
    }
    task.copy.scenes = task.copy.scenes.map((scene) => {
      const sceneSelection = sceneSelections.find(({ sceneId }) => sceneId === scene.sceneId);
      if (!sceneSelection) return scene;
      const selectedScene = candidateSet.candidates
        .find(({ id }) => id === sceneSelection.candidateId)?.tasks
        .find(({ moduleId: taskModuleId }) => taskModuleId === "start-here")?.copy.scenes
        ?.find(({ sceneId }) => sceneId === scene.sceneId);
      return selectedScene ? structuredClone(selectedScene) : scene;
    });
    return [task];
  });
  const tasks = [...candidateSet.sharedTasks, ...selectedTasks];
  return {
    schemaVersion: "topic-page-content-proposal/v1",
    keyword: candidateSet.keyword,
    site: candidateSet.site,
    language: candidateSet.language,
    topicPagePlanDigest: candidateSet.topicPagePlanDigest,
    themeIntentDigest: candidateSet.themeIntentDigest,
    productSelectionDigest: candidateSet.productSelectionDigest,
    tasks: candidateSet.taskOrder.map((expectedTaskId) =>
      tasks.find(({ taskId }) => taskId === expectedTaskId)!
    ),
  };
}

function reviewSelection(
  candidateSet: TopicPageContentCandidateSet,
  value: unknown,
  selectorAgentId: string,
): { decision?: TopicPageContentCandidateSelectionDecision; issues: string[] } {
  const proposal = objectValue(value);
  const issues: string[] = [];
  if (!proposal) {
    return { issues: ["TopicPageContentCandidateSelectionProposal must be a JSON object."] };
  }
  if (proposal.schemaVersion !== "topic-page-content-candidate-selection-proposal/v1") {
    issues.push('schemaVersion must be "topic-page-content-candidate-selection-proposal/v1".');
  }
  if (proposal.candidateSetDigest !== candidateSet.digest) {
    issues.push("Candidate selection candidateSetDigest does not match the candidate set.");
  }
  const rawSelections = Array.isArray(proposal.selections) ? proposal.selections : [];
  if (!Array.isArray(proposal.selections) || rawSelections.length !== candidateSet.targetModuleIds.length) {
    issues.push("Candidate selection must choose exactly one package for every target module.");
  }
  const candidateIds = new Set(candidateSet.candidates.map(({ id }) => id));
  const advisoryWarnings = [...candidateSet.advisoryWarnings];
  const selections = rawSelections.flatMap((rawSelection) => {
    const selection = objectValue(rawSelection);
    if (!selection) return [];
    const moduleId = stringValue(selection.moduleId) as TopicPageContentCandidateModuleId;
    const candidateId = stringValue(selection.candidateId) as TopicPageContentCandidateDirection["id"];
    const reason = stringValue(selection.reason);
    if (!candidateSet.targetModuleIds.includes(moduleId)) {
      issues.push(`Candidate selection module ${moduleId || "unknown"} is not a target module.`);
    }
    if (!candidateIds.has(candidateId)) {
      issues.push(`Candidate selection ${candidateId || "unknown"} is not in the candidate set.`);
    }
    if (!reason || reason.length > 300) {
      issues.push(`Candidate selection for ${moduleId || "unknown"} requires a concise reason.`);
    }
    const sceneSelections = Array.isArray(selection.sceneSelections)
      ? selection.sceneSelections.flatMap((rawSceneSelection) => {
          const sceneSelection = objectValue(rawSceneSelection);
          if (!sceneSelection) {
            advisoryWarnings.push("Ignored a malformed optional Start Here scene selection.");
            return [];
          }
          const sceneId = stringValue(sceneSelection.sceneId);
          const sceneCandidateId = stringValue(
            sceneSelection.candidateId,
          ) as TopicPageContentCandidateDirection["id"];
          const sceneReason = stringValue(sceneSelection.reason);
          const selectedScene = candidateSet.candidates
            .find(({ id }) => id === sceneCandidateId)?.tasks
            .find(({ moduleId: taskModuleId }) => taskModuleId === "start-here")?.copy.scenes
            ?.find((scene) => scene.sceneId === sceneId);
          if (moduleId !== "start-here" || !candidateIds.has(sceneCandidateId) || !selectedScene) {
            advisoryWarnings.push(
              `Ignored optional scene selection ${sceneId || "unknown"}; its scene or candidate was unavailable.`,
            );
            return [];
          }
          return [{
            sceneId,
            candidateId: sceneCandidateId,
            reason: sceneReason || "Selected as the strongest structurally valid scene copy.",
          }];
        })
      : [];
    return moduleId && candidateId && reason
      ? [{
          moduleId,
          candidateId,
          reason,
          ...(sceneSelections.length > 0 ? { sceneSelections } : {}),
        }]
      : [];
  });
  if (!exactOrder(selections.map(({ moduleId }) => moduleId), candidateSet.targetModuleIds)) {
    issues.push("Candidate selections must preserve target module order.");
  }
  if (issues.length > 0) return { issues };
  const decisionBase = {
    schemaVersion: "topic-page-content-candidate-selection/v1" as const,
    candidateSetDigest: candidateSet.digest,
    selections,
    selectorAgentId,
    advisoryWarnings,
  };
  return {
    issues: [],
    decision: {
      ...decisionBase,
      digest: sha256Digest(decisionBase),
    },
  };
}

function fallbackSelection(
  candidateSet: TopicPageContentCandidateSet,
  selectorAgentId: string,
  warnings: readonly string[],
): TopicPageContentCandidateSelectionDecision {
  const candidateId = candidateSet.candidates[0]!.id;
  const decisionBase = {
    schemaVersion: "topic-page-content-candidate-selection/v1" as const,
    candidateSetDigest: candidateSet.digest,
    selections: candidateSet.targetModuleIds.map((moduleId) => ({
      moduleId,
      candidateId,
      reason: "Selector feedback was unavailable; using the first structurally valid package.",
    })),
    selectorAgentId,
    advisoryWarnings: [...candidateSet.advisoryWarnings, ...warnings],
  };
  return {
    ...decisionBase,
    digest: sha256Digest(decisionBase),
  };
}

export async function runTopicPageContentCandidateSelectorWorkflow(request: {
  candidateSet: TopicPageContentCandidateSet;
  contentContext: TopicPageContentContext;
  agent: TopicPageContentCandidateSelectorAgent;
}): Promise<Exclude<
  TopicPageContentCandidateSelectionRun,
  { status: "needs-candidate-selection-proposal" }
>> {
  const brandBrief = request.contentContext.copyBrief.schemaVersion ===
      "topic-page-copy-brief/v3" &&
    request.contentContext.copyBrief.heroStrategy.kind === "brand";
  const brandCriterion = brandBrief
    ? (["brand-distinctiveness", "brand-category-orientation"] as const)
    : [];
  const pending = {
    schemaVersion: "topic-page-content-candidate-selection-run/v1" as const,
    status: "needs-candidate-selection-proposal" as const,
    context: {
      candidateSet: structuredClone(request.candidateSet),
      copyBrief: structuredClone(request.contentContext.copyBrief),
      backgroundEvidence: request.contentContext.backgroundEvidence
        ? structuredClone(request.contentContext.backgroundEvidence)
        : null,
      taskContexts: request.contentContext.tasks.filter(({ moduleId }) =>
        request.candidateSet.targetModuleIds.includes(
          moduleId as TopicPageContentCandidateModuleId,
        )
      ).map((task) => structuredClone(task)),
      criteria: [...SELECTION_CRITERIA, ...brandCriterion],
      selectionPolicy: {
        unit: "module-package-with-optional-scene-picks" as const,
        requireEveryTargetModule: true as const,
        finalContentReviewRequired: true as const,
        qualityEnforcement: "advisory-never-block-generation" as const,
        sceneSelection: "optional-per-scene-with-module-fallback" as const,
        advisoryCriteria: [...ADVISORY_SELECTION_CRITERIA, ...brandCriterion],
      },
    },
  };
  let proposal: unknown;
  try {
    proposal = await request.agent.selectPageContentCandidates(pending);
  } catch (error) {
    const decision = fallbackSelection(
      request.candidateSet,
      request.agent.selectorAgentId ?? request.agent.id,
      [error instanceof Error ? error.message : "Content candidate selector failed."],
    );
    return {
      schemaVersion: "topic-page-content-candidate-selection-run/v1",
      status: "ready",
      decision,
      proposal: selectedProposal(request.candidateSet, decision.selections),
    };
  }
  const reviewed = reviewSelection(
    request.candidateSet,
    proposal,
    request.agent.selectorAgentId ?? request.agent.id,
  );
  if (!reviewed.decision) {
    const decision = fallbackSelection(
      request.candidateSet,
      request.agent.selectorAgentId ?? request.agent.id,
      reviewed.issues,
    );
    return {
      schemaVersion: "topic-page-content-candidate-selection-run/v1",
      status: "ready",
      decision,
      proposal: selectedProposal(request.candidateSet, decision.selections),
    };
  }
  return {
    schemaVersion: "topic-page-content-candidate-selection-run/v1",
    status: "ready",
    decision: reviewed.decision,
    proposal: selectedProposal(request.candidateSet, reviewed.decision.selections),
  };
}
