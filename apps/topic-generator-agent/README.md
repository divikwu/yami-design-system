# TOPIC GENERATOR Agent Runner

Local, server-side execution host for every canonical TOPIC GENERATOR Agent and Skill. The Runner
does not own catalog retrieval, product membership, module rules, evidence validation, digests, or
QA. It loads the checked-in Agent and Skill instructions for one registered stage, asks Codex or
Kiro for a proposal, and returns that proposal to the deterministic `@yami/topic-generator`
runtime.

## Routes

- `POST /topic-page`: `topic-intent`, `background-evidence`, `workflow-planning`,
  `module-merchandising`, `content-writing`, `content-review`, `visual-generation`, and
  `experience-review`.
- `POST /product-selection`: `product-semantic-proposal`, `category-role-proposal`, and
  `scene-proposal`.
- `GET /health`: executor, stage registry, and explicit `imageInput` / `imageGeneration`
  capabilities without credentials.

Each execution loads the selected `SKILL.md`, its directly linked local `references/*` contracts,
and the matching `agents/openai.yaml`. These eleven protocol stages load all nine canonical Skills.
`topic-intent`, all three ProductSelection
stages, and `module-merchandising` share the constrained Topic Strategy Agent; the other stages use
the Orchestrator, Background Evidence, Content, Content Review, Visual, or Experience Review Agent
declared by the repository.

## Start locally

The shortest development path starts the Runner and Web Host together:

```bash
pnpm --filter @yami/topic-generator-agent exec playwright install chromium
pnpm dev:topic-generator
```

`pnpm dev:topic-generator-stack` 是同一完整启动流程的显式别名；仅运行 Web Host 时使用
`pnpm dev:topic-generator-web`。

This uses the authenticated `codex` executable on the machine and wires the Web Host to:

```text
http://127.0.0.1:4400/product-selection
http://127.0.0.1:4400/topic-page
```

For native `generated-images`, Codex must report `image_generation` as enabled and be logged in
with ChatGPT. The Runner invokes the built-in ImageGen capability explicitly; it does not require,
read, or expose `OPENAI_API_KEY`. `GET /health` reports the non-secret provider, model, and auth mode
only after that startup probe succeeds.

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
- The default local execution budget is five minutes per Codex task. Native image tasks run with a
  bounded concurrency of two by default so a multi-module visual stage remains within the Host
  deadline while preserving proposal order.
- CLI processes are invoked without a shell. Semantic stages run in a read-only sandbox.
- Live web search is enabled only for `background-evidence`; all other text stages keep the existing
  bounded tool set. Brand research prioritizes the official site and treats Wikipedia as secondary
  context.
- In `generated-images` mode, every visual task must return real image bytes for its module-specific
  scene brief. Codex invokes the built-in GPT Image 2 capability once per task, inspects the result,
  and copies the accepted source into a task-scoped temporary directory. The Runner then reads the
  actual file, crops it to the maintained slot, converts it to WebP, and derives dimensions, MIME,
  background color, and SHA-256 from the resulting bytes. A proposal or artifact path without
  matching image bytes is rejected. An executor without image-generation capability fails before
  execution instead of returning a placeholder.
- In `source-product-images` mode, `visual-generation` creates deterministic WebP reference
  compositions from approved Yami CDN images. This is a draft-only catalog fallback, not semantic
  scene generation, and final visual QA rejects it.
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

The registry and contract-loading tests cover all seven logical Agents, nine Skills, and eleven
automatic routes. The local Codex executor supports bounded background web research, image input,
native GPT Image 2 generation through the ChatGPT-authenticated Codex CLI, source-product-image
draft composition, and screenshot-based experience review. Startup capability probing fails closed:
if ChatGPT login or `image_generation` is unavailable, `generated-images` returns an explicit
capability failure. The Kiro CLI integration supports the non-research text stages but currently has
neither Host web research, image input, nor image generation, so affected stages return explicit
capability failures instead of pretending those checks ran.
