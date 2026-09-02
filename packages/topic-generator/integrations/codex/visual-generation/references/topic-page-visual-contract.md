# Topic page visual proposal contract

## State boundary

```text
ready TopicPagePlan v2 + ready TopicPageContentSpec
  -> TopicPageVisualContext
  -> mode-bound image bytes + TopicPageVisualProposal
  -> deterministic review
  -> TopicPageAssetManifest
```

The context contains only PagePlan-declared image tasks, their assigned products, the relevant
scene and accepted content task, verified ThemeIntent evidence, and selected categories. A proposal
cannot add tasks, switch components, expose hidden modules, reallocate products, rewrite copy, or
change any digest.

Visual preflight does not revalidate BackgroundEvidence already accepted by ContentSpec.
`background:*` references remain content-only and are not eligible visual direction or alt-text evidence.

`productionMode` is either `generated-images` or `source-product-images`. The proposal must preserve
the requested mode. `generated-images` is the preferred scene path. `source-product-images` is a
draft-quality reference fallback that produces a QA advisory without blocking page completion. Scene tasks may include
`compositionGuidance`; it is a preference for art direction, not a deterministic rejection rule.

## Module scene brief

Every task includes a deterministic `sceneBrief` with:

- a paired subject mode: `scene-first` / `reference-only`, or ShortcutRail-only
  `product-first` / `primary-subject`;
- the ThemeIntent shopping goal, needs, and conditions;
- the module shopping goal and reason;
- relevant selected categories and, when applicable, the exact PagePlan scene;
- the accepted content task ID and localized copy text;
- mandatory semantic evidence references and visual requirements.

For ThemeProductList scene-first tasks, the scene and module theme are primary. The model receives up
to three product images assigned to the current PagePlan scene as optional visual references and
regenerates one complete lifestyle image. A product-free scene is valid. For every referenced product
that appears, the Agent should reproduce the source packaging as faithfully as the image model allows,
including visible brand name and logo, key label text, typography hierarchy, layout, primary colors,
silhouette, closure, and material character. It must not intentionally simplify the product into blank or
generic packaging or invent claims. No exact product-count or one-to-one coverage check applies, and
packaging fidelity remains a strong generation priority rather than a rejection gate. The Host does not extract
product pixels, composite source layers, or fall back to source-image compositing. The square source should keep its key action in
the upper-right across centered wide and card crops, reserve a calm lower-left copy-safe area, and contain
no baked text, gradient, text panel, or scrim. These composition points are soft art direction rather
than deterministic rejection gates: a saved decodable image proceeds without semantic retry. Other
scene-first tasks may include environmental vessels and category-relevant containers when they support
the scene; object type alone is never a rejection reason. Each ShortcutRail task instead receives one representative
product image when available as a visual reference for a single-product lifestyle scene. Missing source
image URLs do not remove or block the task; trusted category and accepted-copy context remain sufficient. A centered primary subject,
circular-crop margin, secondary category-relevant context, and faithful reproduction of visible source
packaging are strong generation guidance rather than acceptance requirements.
A ThemeHero attaches all available assigned catalog images to one generation request and asks the
Agent to regenerate one complete 16:9 lifestyle scene. Products and environment are created together
so lighting, depth, shadows, and materials remain coherent. The Host does not extract or composite
product pixels. The references are a flexible product family rather than a count
checklist, so the generated scene may use a natural subset or grouping without one-to-one placement.
Every referenced product that appears should preserve its visible packaging text, brand identity, layout,
colors, silhouette, closure, and material as faithfully as the image model allows. The Agent must not copy source-image backdrops, discs, white
canvases, or studio props as part of a product. When the output file exists, Hero bypasses semantic
visual rejection and proceeds directly to deterministic byte, MIME, ratio, dimension, and digest
validation. No placement recovery, source-layer composition, or Hero visual fallback runs.
A BrandProductRail task attaches up to three available catalog images assigned to its exact brand
binding as optional visual references. Packaging and logos are permitted but neither is required to
appear. A product-led banner, a logo-led scene, or an atmosphere-led banner without packaging or a
logo is valid when it follows the module brief. Any visible referenced package must preserve its brand
name, logo, label hierarchy, layout, colors, silhouette, closure, and material as faithfully as the
image model allows. A logo or wordmark may appear clearly only when an attached reference visibly
supports it; the Agent must not invent, approximate, alter, translate, or borrow a brand asset. When no
referenced brand asset appears, the scene remains category-relevant without claiming a distinct visual
identity inferred from the brand name or product mix. Packaging use, logo use, reference coverage,
brand-asset fidelity, and wide-crop composition remain review signals rather than deterministic
rejection gates.
A Shortcut may use a source-backed lifestyle fallback only after its bounded technical retries fail;
semantic or visual differences never trigger fallback. This task-level fallback must not discard other
completed assets or block the page.
A Hero that exhausts its bounded generation attempts is omitted instead of substituting a source-layer
composition. The Host keeps all completed tasks and continues with a partial or empty manifest.
The Host derives direction evidence, reference product IDs, attached product IDs, localized alt text,
module/component/kind identity, and fallback metadata from the task context. Agent omissions or drift
in those fields are normalized rather than rejected.

## Maintained image slots

| Component | Asset kind | Task granularity | Ratio | Minimum | Alt text | Background color |
| --- | --- | --- | --- | --- | --- | --- |
| `ThemeHero` | `hero-image` | one visible Hero | `16:9` | 1200×675 | required | required |
| `ShortcutRail` | `shortcut-image` | one source-backed product lifestyle image per assigned shortcut | `1:1` | 512×512 | `null` (decorative) | optional |
| `ThemeProductList` | `scene-image` | one per PagePlan scene | `1:1` | 1024×1024 | required | required |
| `BrandProductRail` | `brand-banner` | one per unique assigned brand, with up to three optional same-brand product references | `111:40` | 888×320 | required | optional |

`ProductList` and `ReviewList` do not declare generated image tasks in this contract. Product cards
continue to use catalog image identities.

## Proposal shape

```json
{
  "schemaVersion": "topic-page-visual-proposal/v1",
  "keyword": "Matcha",
  "site": "us",
  "language": "zh",
  "topicPagePlanDigest": "sha256:...",
  "topicPageContentSpecDigest": "sha256:...",
  "themeIntentDigest": "sha256:...",
  "productSelectionDigest": "sha256:...",
  "productionMode": "generated-images",
  "assets": [
    {
      "taskId": "asset-hero",
      "moduleId": "hero",
      "component": "ThemeHero",
      "kind": "hero-image",
      "direction": {
        "prompt": "Sunlit matcha ritual using the assigned products as references.",
        "negativePrompt": "collage, watermark, overlay text",
        "evidenceRefs": [
          "theme-intent:scenario:matcha",
          "product:matcha-1",
          "content-task:content-hero"
        ],
        "referenceProductIds": ["matcha-1"],
        "generationProvenance": {
          "provider": "codex-native",
          "modelSource": "unreported",
          "attempts": 1,
          "cacheHit": false
        }
      },
      "altText": {
        "language": "zh",
        "text": "桌面上的抹茶冲泡场景",
        "evidenceRefs": ["theme-intent:scenario:matcha", "product:matcha-1"]
      },
      "artifact": {
        "ref": "assets/topic/matcha/hero.webp",
        "mimeType": "image/webp",
        "width": 1600,
        "height": 900,
        "digest": "sha256:...",
        "focalPoint": { "x": 0.5, "y": 0.45 },
        "backgroundColor": "#dfe3d4"
      }
    }
  ]
}
```

The example abbreviates the asset array. A real proposal contains the tasks that completed in their
declared relative order; it may contain a partial subset or zero assets. Unknown, duplicate, or
out-of-order task IDs remain invalid. The Host derives `referenceProductIds` from task assignments.

## Evidence namespaces and scope

- `theme-intent:<evidence-id>` — exact ID from `themeIntent.evidenceRefs`.
- `selected-category:<category-id>` — exact returned selected-category ID.
- `product:<task-product-id>` — product assigned to the current visual task only.
- `scene:<task-scene-id>` — the current scene-image task's PagePlan scene only.
- `content-task:<module-content-task-id>` — the accepted content task attached to this visual task.

An accepted content task can itself contain `background:*` copy references. They are not part of
this list and must not be copied into a visual proposal.

The Host attaches the exact scene-brief evidence to art direction and required alt text. Evidence
constrains the direction; it does not authorize facts absent from the referenced artifact.

## Artifact rules

- `ref` must be a safe relative POSIX path with no URL scheme, absolute prefix, backslash, empty
  segment, `.` segment, or `..` traversal.
- MIME type must be `image/webp`, `image/png`, or `image/jpeg`, and its filename extension must
  match.
- Width and height must be positive integers, meet the slot minimum, and stay within 2% of the
  target ratio.
- `digest` is the lowercase SHA-256 digest of the actual generated bytes.
- Focal-point coordinates are finite values from 0 through 1.
- Required background colors and all supplied colors use six-digit hex notation.
- Every task uses a unique artifact path.
- When a task returns `compositionGuidance`, prefer it during art direction but do not treat it as a
  mandatory crop or a hard QA condition.

The deterministic module validates metadata and scope. Stage 06 opens every returned file and verifies
its bytes against the digest. Missing assets and visual, accessibility, provenance, or responsive-crop
findings are advisory; byte drift, undeclared identity, broken upstream bindings, and malformed module
or artifact data remain blocking integrity failures.

## Ready output

`topic-page-asset-manifest/v1` preserves the accepted assets, language, strategy and template refs,
all four upstream digests, and computes its own SHA-256 digest. It reports
`asset-manifest-ready`, including for a partial or empty asset set. It does not by itself assert
publication-quality visuals.
