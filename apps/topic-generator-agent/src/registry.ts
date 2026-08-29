import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type AgentProtocol = "topic-page" | "product-selection";

export type TopicPageStage =
  | "topic-intent"
  | "background-evidence"
  | "workflow-planning"
  | "module-merchandising"
  | "content-writing"
  | "content-review"
  | "visual-generation"
  | "experience-review";

export type ProductSelectionStage =
  | "product-semantic-proposal"
  | "category-role-proposal"
  | "scene-proposal";
export type AgentStage = TopicPageStage | ProductSelectionStage;

export interface AgentRoute {
  protocol: AgentProtocol;
  stage: AgentStage;
  agentId: string;
  kiroAgent: string;
  skill: string;
  skillPath: string;
  agentConfigPath: string;
  responseSchemaVersion:
    | "topic-page-agent-response/v1"
    | "product-selection-agent-response/v1";
}

const repositoryRootFromModule = fileURLToPath(new URL("../../..", import.meta.url));

export function repositoryRoot(environment: NodeJS.ProcessEnv = process.env) {
  const configured = environment.TOPIC_AGENT_RUNNER_REPO_ROOT?.trim();
  if (!configured) return repositoryRootFromModule;
  if (!isAbsolute(configured)) {
    throw new Error("TOPIC_AGENT_RUNNER_REPO_ROOT must be an absolute path.");
  }
  return resolve(configured);
}

function route(options: {
  protocol: AgentProtocol;
  stage: AgentStage;
  agentId: string;
  kiroAgent: string;
  skill: string;
  responseSchemaVersion: AgentRoute["responseSchemaVersion"];
}): AgentRoute {
  const integrationRoot = `packages/topic-generator/integrations/codex/${options.skill}`;
  return {
    ...options,
    skillPath: `${integrationRoot}/SKILL.md`,
    agentConfigPath: `${integrationRoot}/agents/openai.yaml`,
  };
}

export const AGENT_ROUTES: readonly AgentRoute[] = [
  route({
    protocol: "topic-page",
    stage: "topic-intent",
    agentId: "topic-strategy",
    kiroAgent: "topic-strategy",
    skill: "topic-intent",
    responseSchemaVersion: "topic-page-agent-response/v1",
  }),
  route({
    protocol: "topic-page",
    stage: "background-evidence",
    agentId: "topic-background-evidence",
    kiroAgent: "topic-background-evidence",
    skill: "background-evidence",
    responseSchemaVersion: "topic-page-agent-response/v1",
  }),
  route({
    protocol: "topic-page",
    stage: "workflow-planning",
    agentId: "topic-page-orchestrator",
    kiroAgent: "topic-page-orchestrator",
    skill: "page-orchestration",
    responseSchemaVersion: "topic-page-agent-response/v1",
  }),
  route({
    protocol: "topic-page",
    stage: "module-merchandising",
    agentId: "topic-strategy",
    kiroAgent: "topic-strategy",
    skill: "page-merchandising",
    responseSchemaVersion: "topic-page-agent-response/v1",
  }),
  route({
    protocol: "topic-page",
    stage: "content-writing",
    agentId: "topic-content",
    kiroAgent: "topic-content",
    skill: "page-copywriting",
    responseSchemaVersion: "topic-page-agent-response/v1",
  }),
  route({
    protocol: "topic-page",
    stage: "content-review",
    agentId: "topic-content-review",
    kiroAgent: "topic-content-review",
    skill: "content-review",
    responseSchemaVersion: "topic-page-agent-response/v1",
  }),
  route({
    protocol: "topic-page",
    stage: "visual-generation",
    agentId: "topic-visual",
    kiroAgent: "topic-visual",
    skill: "visual-generation",
    responseSchemaVersion: "topic-page-agent-response/v1",
  }),
  route({
    protocol: "topic-page",
    stage: "experience-review",
    agentId: "topic-review",
    kiroAgent: "topic-review",
    skill: "page-review",
    responseSchemaVersion: "topic-page-agent-response/v1",
  }),
  route({
    protocol: "product-selection",
    stage: "product-semantic-proposal",
    agentId: "topic-strategy",
    kiroAgent: "topic-strategy",
    skill: "product-selection",
    responseSchemaVersion: "product-selection-agent-response/v1",
  }),
  route({
    protocol: "product-selection",
    stage: "category-role-proposal",
    agentId: "topic-strategy",
    kiroAgent: "topic-strategy",
    skill: "product-selection",
    responseSchemaVersion: "product-selection-agent-response/v1",
  }),
  route({
    protocol: "product-selection",
    stage: "scene-proposal",
    agentId: "topic-strategy",
    kiroAgent: "topic-strategy",
    skill: "product-selection",
    responseSchemaVersion: "product-selection-agent-response/v1",
  }),
] as const;

export function findAgentRoute(protocol: AgentProtocol, stage: string) {
  return AGENT_ROUTES.find((candidate) =>
    candidate.protocol === protocol && candidate.stage === stage
  );
}
