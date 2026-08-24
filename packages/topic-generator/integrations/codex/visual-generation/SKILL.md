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
2. Follow the returned subject mode. For `scene-first` / `reference-only` tasks, make the scene and
   module theme primary; assigned products need not appear, and generated scenes exclude bottles,
   jars, tubes, pumps, droppers, sachets, and product boxes. For a ShortcutRail
   `product-first` / `primary-subject` task, use its one assigned representative product image as a
   mandatory visual reference, keep that product fully visible near the center, and generate a
   category-relevant lifestyle environment around it. For a ThemeHero `scene-composite` /
   `locked-source-products` task, first derive a concise scene prompt from the accepted Hero copy and
   assigned product mix, then generate only that background. Choose the scene elements from the task
   evidence rather than a category-specific prop template. The Host subsequently composites up to
   five assigned verified source product images as real locked layers; three to five is the preferred
   editorial range when available, not a generation threshold. Let the Agent choose the camera,
   support surface, depth pattern, materials, and light from the evidence while preserving natural
   environmental shadows. Reject steep or internally inconsistent perspective, missing credible
   product footholds, a placement zone that forces one flat row, and conflicting light or shadow
   directions. During Host composition, keep the central representative product unobscured in front,
   stagger secondary products through middle and rear depths, and use restrained same-direction
   photographic contact shadows. After inspecting the generated background, return non-blocking
   normalized support-region bounds plus x/y contact points, scale, and depth for each assigned
   product when credible footholds can be identified. The support region must be one continuous,
   upward-facing, light-neutral plane. Each bottom contact point must lie inside it on that surface,
   never a vertical face, wall, or open air; verify all points against the actual generated
   pixels before returning them. The Host uses this placement plan to follow the Agent-chosen surfaces
   and perspective. Missing or invalid guidance triggers one read-only visual recovery pass over the
   same background; recovered guidance is labeled `agent-recovered` and still faces all Host geometry
   and final semantic checks. If recovery fails, the Host discards that background and uses its known-safe
   neutral Hero background, never fixed anchors on an arbitrary scene. Keep
   the group visually centered and keep the bottom quarter free of principal elements. Never use
   tiled grids, product montages, lineups, or unreferenced products.
3. Build art direction only from its ThemeIntent evidence, selected categories, assigned products,
   scene, and accepted content task. Product image URLs are visual references, not permission to
   infer ingredients, benefits, popularity, ratings, inventory, discounts, or customer outcomes.
   The accepted content task may cite `background:*` claims. Treat those references as already
   reviewed copy provenance: do not revalidate them in this stage and never copy them into visual
   direction or alt-text evidenceRefs.
4. Preserve every returned `referenceProductId`. Do not introduce unassigned products or change a
   brand, scene, module, component, crop, or text field.
5. Follow the selected production mode. Generate a new scene only for `generated-images`. For a Hero,
   use product metadata to plan the background but do not attach the product sources to the background
   generator or ask it to redraw packaging; compose the verified catalog main images afterward as
   locked source layers. Preserve an existing alpha channel. For a verified uniform white-background
   main image, derive only a deterministic mask for the edge-connected white canvas, protect the
   complete product silhouette, crop redundant outer whitespace, and preserve every product pixel;
   do not run a generative redraw. If neither source condition
   is reliable, use a deliberate studio tile only with the known-safe neutral Hero fallback. Attach the
   verified source product image to every product-first Shortcut task and preserve its silhouette,
   proportions, colors, orientation, and visible packaging identity. Do not invent, rewrite, or add
   labels, logos, packaging, or claims. For `source-product-images`, preserve the assigned Yami
   product images and return only the explicit draft reference composition.
6. Treat `compositionGuidance` as a preference, not a hard crop. When present, favor its subject
   area and lower-area usage unless the scene clearly benefits from a different composition.
7. Inspect the produced image before accepting it. For a scene-composite Hero background, reject a
   generated product or packaging-like placeholder, a scene that conflicts with the accepted copy or
   assigned product mix, a missing central landing area or credible footholds, steep or internally
   inconsistent perspective, a placement zone that forces one flat row, conflicting light or shadow
   directions, or a principal element in the bottom quarter. Natural environmental shadows are
   allowed; reject only empty product silhouettes, empty product-shaped shadows, and other product
   placeholders. After source-layer composition, verify that the assigned
   real products remain visible and centered, the primary product is not obscured, every contact
   point remains inside the declared support region, overlap and bottom-safe-area limits pass Host
   geometry verification, and every contact shadow follows the same supporting plane and light
   direction. Run that semantic contact/source-fidelity check as a separate read-only vision pass
   over the completed composite and exact catalog sources; a rejected pass consumes the Host-owned
   bounded retry and then uses the known-safe neutral Hero fallback. Record source digests,
   preparation methods, verified bounds, overlap, support-region
   lightness, attempt count, cache reuse, bounded fallback reason, provider, and only runtime-reported
   model identity. Never
   infer the image model name from feature availability.
   For scene-first tasks, reject a packshot, product
   grid, montage, conflicting environment, or packaging-like object. For product-first Shortcuts,
   reject a missing, duplicated, cropped, off-center, tiny, or materially altered representative
   product; also reject an environment that becomes the primary subject. Preserve clear margin for
   the component's circular crop.
   Save the actual bytes to a new safe relative
   path and record their true MIME type, pixel dimensions, SHA-256 digest, focal point, and any
   required background color.
8. Use `null` alt text for decorative shortcut images. Write concise localized alt text for Hero,
   scene, and brand-banner images, grounded only in the task evidence.

If native generation still fails after its bounded retries, do not discard completed tasks. A Hero
may use the neutral source-layer fallback background while preserving the same real assigned product
composition and bottom-quarter safety. A
product-first Shortcut may use a source-backed lifestyle fallback that preserves its exact assigned
product, centers it with circular-crop margin, and adds only a restrained secondary environment.
Other scene-first tasks still stop with the task ID and generator error. Never emit a complete proposal
with a missing or invented artifact.

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
