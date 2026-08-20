# TOPIC GENERATOR Agent Runner

Local, server-side execution host for every canonical TOPIC GENERATOR Agent and Skill. The Runner
does not own catalog retrieval, product membership, module rules, evidence validation, digests, or
QA. It loads the checked-in Agent and Skill instructions for one registered stage, asks Codex or
Kiro for a proposal, and returns that proposal to the deterministic `@yami/topic-generator`
runtime.

## Routes

- `POST /topic-page`: `topic-intent`, `workflow-planning`, `module-merchandising`,
  `content-writing`, `visual-generation`, and `experience-review`.
- `POST /product-selection`: `category-role-proposal` and `scene-proposal`.
- `GET /health`: executor and stage registry without credentials.

Each execution loads the selected `SKILL.md`, its directly linked local `references/*` contracts,
and the matching `agents/openai.yaml`. These eight protocol stages load all seven canonical Skills.
`topic-intent`, both ProductSelection
stages, and `module-merchandising` share the constrained Topic Strategy Agent; the other stages use
the Orchestrator, Content, Visual, or Review Agent declared by the repository.

## Start locally

The shortest development path starts the Runner and Web Host together:

```bash
pnpm --filter @yami/topic-generator-agent exec playwright install chromium
pnpm dev:topic-generator-stack
```

This uses the authenticated `codex` executable on the machine and wires the Web Host to:

```text
http://127.0.0.1:4400/product-selection
http://127.0.0.1:4400/topic-page
```

To run only the service:

```bash
pnpm --filter @yami/topic-generator-agent exec playwright install chromium
cp apps/topic-generator-agent/.env.example apps/topic-generator-agent/.env.local
pnpm dev:topic-generator-agent
```

Set `TOPIC_AGENT_RUNNER_EXECUTOR=kiro` to use `kiro-cli`. The selected CLI must already be installed
and authenticated. The Runner never accepts provider credentials in a request and never sends
them to the browser.

## Host configuration

When starting the apps separately, configure the Topic Generator Host:

```bash
TOPIC_GENERATOR_AGENT_ENDPOINT=http://127.0.0.1:4400/product-selection
TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT=http://127.0.0.1:4400/topic-page
TOPIC_GENERATOR_PREVIEW_ORIGIN=http://127.0.0.1:3300
```

If `TOPIC_AGENT_RUNNER_TOKEN` is set, use the same value for
`TOPIC_GENERATOR_AGENT_TOKEN` and `TOPIC_GENERATOR_PAGE_AGENT_TOKEN`.

## Safety and capability boundaries

- The default bind address is `127.0.0.1`; remote HTTP is not a supported deployment mode.
- Only registered protocol stages can select an Agent or Skill. Request data cannot choose a file.
- Requests, subprocess output, and execution time are bounded.
- The default local execution budget is five minutes so image composition and two-viewport review
  can finish without weakening any deterministic validation.
- CLI processes are invoked without a shell. Semantic stages run in a read-only sandbox.
- In source-product-image mode, `visual-generation` first creates real deterministic WebP assets
  from approved Yami CDN images, then supplies those images to an image-capable CLI for semantic
  direction and alt text.
- For `module-merchandising`, an image-capable executor first creates the complete text proposal.
  The Runner then prepares 512px thumbnails only for its Start Here assignments plus a small number
  of title-similar source-scene alternatives. A second bounded Agent pass confirms visual duplicate
  groups; the Runner retains the higher-selling listing, falling back to source rank, while
  preserving distinct sizes, formulas, and multipacks.
- `experience-review` opens the generation-bound desktop and mobile previews, verifies their
  digest marker, captures both viewports, and supplies the screenshots to an image-capable CLI.
- The existing Host validates the returned proposal and all visual bytes. A successful Runner
  response is never equivalent to accepted selection, QA, approval, or publication.

## Verified capability versus protocol support

The registry and contract-loading tests cover all five logical Agents, seven Skills, and eight
automatic stages. The Codex executor supports source-product-image composition and screenshot-based
experience review. The Kiro CLI integration supports the text stages but currently has no image
attachment interface, so visual generation and experience review return an explicit capability
failure instead of pretending those checks ran.
