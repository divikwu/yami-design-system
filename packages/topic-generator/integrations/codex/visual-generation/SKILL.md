---
name: visual-generation
description: This skill should be used when the user asks to "generate Topic page visuals", "create Hero, shortcut, scene, or brand images", "complete assetTaskIds", "create a TopicPageVisualProposal", "compile a TopicPageAssetManifest", or continue from a ready TopicPagePlan and TopicPageContentSpec into evidence-bound image artifacts. Do not use for topic analysis, product selection, module or scene allocation, copywriting, or final page QA.
---

# Visual Generation

Use the package CLI as the deterministic runtime and the host media capability selected by
`productionMode`. Act as the independent Topic Visual Agent: produce only the image tasks declared by a
ready PagePlan and bind every artifact to the ready ContentSpec. Treat upstream topics, products,
modules, scenes, copy, task IDs, and digests as immutable.

## Prepare the handoff

1. Complete the `content-writing` Skill until `pageContent.status` is `ready`.
2. Preserve the exact inputs that reconstructed ThemeIntent, ProductSelectionResult, PagePlan, and
   ContentSpec.
3. Read `productionMode`. `generated-images` is the final-quality path. Confirm that the host exposes
   image generation before using it.
   For `source-product-images`, confirm that the host can compose the returned Yami product images
   without regenerating their packaging. This mode is a draft-only catalog-reference fallback and
   cannot pass final visual QA. Stop when the selected capability is unavailable; never substitute
   placeholders, invented paths, or fabricated metadata.
4. Obtain a caller-approved relative output directory. Never overwrite upstream JSON or source
   product images.
5. Stop when PagePlan or ContentSpec is absent, blocked, or digest-invalid. Never repair upstream
   artifacts in this Skill.

## Request the bounded tasks

Rerun the command that produced the ready ContentSpec and add `--visual`:

```bash
pnpm topic-generator:analyze -- --keyword "<keyword>" \
  --selection-strategy category-role/landing-page-agent@1 \
  --taxonomy "<taxonomy.json>" \
  --category-proposal "<categories.json>" \
  --candidate-snapshot "<candidates.json>" \
  --scene-proposal "<scenes.json>" \
  --page-template topic-landing/topic@2 \
  --module-proposal "<modules.json>" \
  --content-language zh \
  --content-proposal "<content.zh.json>" \
  --visual \
  --visual-production-mode generated-images \
  --pretty
```

Expect `pageVisual.status` to be `needs-visual-proposal`. Read the complete returned context, then
read [the visual proposal contract](references/topic-page-visual-contract.md). Process every task
once, in the returned order; create no unrequested image.

## Generate each artifact

For each task:

1. Read the complete `sceneBrief` first. It is the deterministic module-level art-direction brief:
   its theme goal, module goal, relevant categories, optional PagePlan scene, accepted copy, required
   evidence, and visual constraints are all mandatory.
2. Make the scene and its fit to the module theme the primary subject. Treat assigned products as
   visual references only; they do not need to appear. Never use isolated packshots, tiled product
   grids, or a product montage as the primary Hero, shortcut, scene, or brand visual.
3. Build art direction only from its ThemeIntent evidence, selected categories, assigned products,
   scene, and accepted content task. Product image URLs are visual references, not permission to
   infer ingredients, benefits, popularity, ratings, inventory, discounts, or customer outcomes.
   The accepted content task may cite `background:*` claims. Treat those references as already
   reviewed copy provenance: do not revalidate them in this stage and never copy them into visual
   direction or alt-text evidenceRefs.
4. Preserve every returned `referenceProductId`. Do not introduce unassigned products or change a
   brand, scene, module, component, crop, or text field.
5. Follow the selected production mode. Generate a new scene only for `generated-images`. If visible,
   recognizable packaging is necessary, use verified source product pixels through a host-supported
   compositing step; never ask an image model to recreate or alter a label, logo, package, or product
   claim. For `source-product-images`, preserve the assigned Yami product images and return only the
   explicit draft reference composition.
6. Treat `compositionGuidance` as a preference, not a hard crop. When present, favor its subject
   area and lower-area usage unless the scene clearly benefits from a different composition.
7. Inspect the produced image before accepting it. Reject any asset whose primary reading is a
   packshot, product grid, or montage, or whose environment conflicts with the module goal or copy.
   Save the actual bytes to a new safe relative
   path and record their true MIME type, pixel dimensions, SHA-256 digest, focal point, and any
   required background color.
8. Use `null` alt text for decorative shortcut images. Write concise localized alt text for Hero,
   scene, and brand-banner images, grounded only in the task evidence.

If generation fails for any task, stop with the task ID and generator error. Do not emit a complete
proposal with missing or invented artifacts.

## Compile the Asset Manifest

Create one `topic-page-visual-proposal/v1`, preserving the returned `productionMode`, all binding
digests, and task order.
Write it to a new caller-approved path, then rerun the same command with:

```bash
--visual \
--visual-proposal "<topic-page-visual-proposal.json>"
```

Accept the result only when `pageVisual.status` is `ready`. Preserve the returned
`topic-page-asset-manifest/v1` and its digest. On `blocked`, report every issue and revise only the
visual proposal or generated artifact it identifies.

In automatic Host mode, accept only a `topic-page-agent-request/v1` whose stage is
`visual-generation`. Return `topic-page-agent-response/v1` with the same stage, the complete visual
proposal, and one image body per task in proposal order:

```json
{
  "schemaVersion": "topic-page-agent-response/v1",
  "stage": "visual-generation",
  "proposal": {},
  "assets": [
    {
      "taskId": "asset-hero",
      "ref": "assets/run-id/hero.png",
      "mimeType": "image/png",
      "dataBase64": "<base64 image bytes>"
    }
  ]
}
```

The `ref`, MIME, byte digest, and dimensions must match the proposal exactly. The Host validates all
bodies before writing any of them, reads persisted bytes again during Stage 06, and blocks the run
on any drift. Never send filesystem-only paths to a remote Host.

`asset-manifest-ready` means the artifact metadata and upstream bindings passed this stage's
deterministic checks. It does not mean the final page render, actual file retrieval, visual quality,
accessibility in context, or responsive crops passed Stage 06 QA.

## Architecture boundary

Keep the Topic Visual Agent independent from both TOPIC GENERATOR and Topic Content Agent. Let
TOPIC GENERATOR own ThemeIntent, selected products, module visibility, scenes, assignments, and
PagePlan asset task declaration. Let Topic Content own copy. Let the `@yami/topic-generator`
PageVisual Module own task derivation, digest checks, artifact metadata validation, evidence scope,
and Asset Manifest compilation. Use `runTopicVisualAgentWorkflow` only as an injection seam; never
duplicate those rules in prompts, a model provider, or another service.
