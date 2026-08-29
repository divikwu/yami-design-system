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

1. Complete the `page-copywriting` Skill until `pageContent.status` is `ready`.
2. Preserve the exact inputs that reconstructed ThemeIntent, ProductSelectionResult, PagePlan, and
   ContentSpec.
3. Read `productionMode`. `generated-images` is the final-quality path. Confirm that the host exposes
   image generation before using it.
   For `source-product-images`, confirm that the host can compose the returned Yami product images
   without regenerating their packaging. This mode is a draft-quality catalog-reference fallback.
   If the selected capability is unavailable, report the affected task as skipped and let the Host
   continue with the completed subset; never substitute placeholders, invented paths, or fabricated metadata.
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
read [the visual proposal contract](references/topic-page-visual-contract.md). Attempt every task
once, in the returned order; create no unrequested image. A valid response may contain an ordered
subset, including zero assets, when technical failures are reported as advisory issues.

## Generate each artifact

For each task:

1. Read the complete `sceneBrief` first. It is the deterministic module-level art-direction brief:
   its theme goal, module goal, relevant categories, optional PagePlan scene, accepted copy, required
   evidence, and visual constraints are all mandatory.
2. Follow the returned subject mode. For a ThemeProductList `scene-first` / `reference-only` task,
   make the scene and module theme primary. Attach the available products assigned to the current
   scene as optional visual references and regenerate one complete lifestyle image. A product-free
   scene is valid. For every referenced product that appears, reproduce the source packaging as faithfully
   as the image model allows: preserve the visible brand name and logo, key label text, typography hierarchy,
   layout, primary colors, silhouette, closure, and material character. Never simplify it into blank or generic
   packaging; copy only visible source text and do not invent claims. Do not require exact product count or
   one-to-one coverage. Packaging fidelity is a strong generation priority rather than a rejection gate.
   For every generated task, environmental vessels and category-relevant containers may appear when
   they support the scene; never reject an image by container type alone. Continue to avoid fabricated
   packaging text, logos, or product claims. For a ShortcutRail
   `product-first` / `primary-subject` task, use its representative product image when available as a visual
   reference for a single-product, category-relevant lifestyle scene. When the image URL is absent,
   generate from the trusted category and accepted-copy context instead of blocking. Favor a clear centered subject
   and circular-crop margin, and reproduce its visible packaging text, brand identity, layout, colors,
   silhouette, closure, and material as faithfully as the image model allows. Packaging fidelity is strong
   generation guidance rather than an acceptance gate. For a ThemeHero `scene-first` /
   `reference-only` task, attach the assigned product images as visual references and generate
   one complete 16:9 multi-product lifestyle scene. Products and environment are regenerated together
   so light, depth, contact shadows, and materials belong to one image. The references are a flexible
   product family, not a quantity checklist: the model may use a natural subset or grouping. For every
   referenced product that appears, reproduce visible packaging text, brand identity, layout, colors,
   silhouette, closure, and material as faithfully as the image model allows. Never simplify it into blank
   or generic packaging. Do not require one-to-one placement, and do not copy source-image
   backdrops, discs, white canvases, or studio props as part of a product.
3. Build art direction only from its ThemeIntent evidence, selected categories, assigned products,
   scene, and accepted content task. Product image URLs are visual references, not permission to
   infer ingredients, benefits, popularity, ratings, inventory, discounts, or customer outcomes.
   The accepted content task may cite `background:*` claims. Treat those references as already
   reviewed copy provenance: do not revalidate them in this stage and never copy them into visual
   direction or alt-text evidenceRefs.
4. Do not introduce unassigned products or change a brand, scene, module, component, crop, or text
   field. The Host derives task identity, evidence refs, assigned and attached product IDs, localized
   alt text, and structural metadata from the frozen task context; Agent omissions or drift in those
   fields are normalized rather than treated as generation blockers.
5. Follow the selected production mode. Generate a new scene only for `generated-images`. For a Hero,
   attach the available assigned product sources to the same generation request and generate the
   complete scene directly. Do not request a placement plan, extract product pixels, composite locked
   layers, or substitute a deterministic Hero fallback. For a ThemeProductList scene, attach up to
   three available products assigned to the current scene to the same generation request and regenerate
   the complete scene directly. Products remain optional; if products appear, aim for at least one to
   visibly reflect a current-scene reference rather than only generic unlabeled containers. Do not
   extract product pixels, composite source layers, enforce product count, or fall back to source-image compositing. Attach the
   representative product image to a product-first Shortcut task when it exists and generate one product-led
   lifestyle scene. Exact SKU identity and packaging reproduction are not acceptance
   requirements. For `source-product-images`, preserve the assigned Yami
   product images and return only the explicit draft reference composition.
6. Treat `compositionGuidance` as a preference, not a hard crop. When present, favor its subject
   area and lower-area usage unless the scene clearly benefits from a different composition.
7. Inspect the produced image before accepting it. For a Hero, do not perform semantic visual
   rejection: when the requested image file exists, return it as accepted. Do not reject for product
   count, which references were used, composition, label differences, or packaging fidelity. The Host
   still validates that bytes exist, decode, match the required slot ratio and minimum size, and records
   attempt count, cache reuse, provider, and only runtime-reported model identity. Never infer the image
   model name from feature availability.
   For ThemeProductList scenes, treat product-reference usage, packaging fidelity, packshot avoidance, scene fidelity,
   responsive composition, the upper-right action area, and the quiet lower-left copy-safe area as soft
   guidance. When a decodable image exists, accept it without semantic rejection; do not reject it for
   missing products, product count, packaging differences, or which references were used. Packaging fidelity is strong
   generation guidance even though it is not a rejection gate. For other scene-first tasks, likewise
   accept any saved decodable image; container choice and packaging-like props are review signals only.
   For product-first Shortcuts, likewise accept any saved decodable image;
   product identity, placement, packaging, and circular-crop safety remain review signals; packaging fidelity is strong
   generation guidance even though a saved decodable image is accepted.
   Save the actual bytes to a new safe relative
   path and record their true MIME type, pixel dimensions, SHA-256 digest, focal point, and any
   required background color.
8. Use `null` alt text for decorative shortcut images. Write concise localized alt text for Hero,
   scene, and brand-banner images, grounded only in the task evidence.

If native generation still fails after its bounded technical retries, omit that task, report one concise
advisory issue, and preserve every completed task. Semantic or visual differences never trigger fallback
or block the page. A Hero may be omitted but must not substitute a source-layer composition. A
product-first Shortcut may use a source-backed lifestyle fallback only after its bounded technical retries
fail. Never invent an artifact or metadata for an omitted task.

## Compile the Asset Manifest

Create one `topic-page-visual-proposal/v1`, preserving the returned `productionMode`, all binding
digests, and declared order among the tasks that completed. Missing tasks are advisory and do not
prevent an `asset-manifest-ready` result.
Write it to a new caller-approved path, then rerun the same command with:

```bash
--visual \
--visual-proposal "<topic-page-visual-proposal.json>"
```

Accept the result only when `pageVisual.status` is `ready`. Preserve the returned
`topic-page-asset-manifest/v1` and its digest. On `blocked`, report every issue and revise only the
visual proposal or generated artifact it identifies.

In automatic Host mode, accept only a `topic-page-agent-request/v1` whose stage is
`visual-generation`. Return `topic-page-agent-response/v1` with the same stage, the ordered partial
visual proposal, one image body per returned proposal asset, and optional advisory `issues`:

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
only on byte, identity, binding, or other data-integrity drift. It can compile and render a page with
an empty asset manifest. Never send filesystem-only paths to a remote Host.

`asset-manifest-ready` means the artifact metadata and upstream bindings passed this stage's
deterministic checks. It does not mean the final page render, actual file retrieval, visual quality,
accessibility in context, or responsive crops passed Stage 06 QA.

## Architecture boundary

Keep the Topic Visual Agent independent from both TOPIC GENERATOR and Topic Content Agent. Let
TOPIC GENERATOR own ThemeIntent, selected products, module visibility, scenes, assignments, and
PagePlan asset task declaration. Let Topic Content own copy. Let the `@yami/topic-generator`
PageVisual Module own task derivation, digest checks, artifact metadata validation, Host-normalized
evidence and accessibility metadata, and Asset Manifest compilation. Use
`runTopicVisualAgentWorkflow` only as an injection seam; never
duplicate those rules in prompts, a model provider, or another service.
