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

Visual preflight may receive the BackgroundEvidence bundle already bound to ContentSpec only to
revalidate accepted copy provenance. `background:*` references remain content-only and are not
eligible visual direction or alt-text evidence.

`productionMode` is either `generated-images` or `source-product-images`. The proposal must preserve
the requested mode. `generated-images` is the final-quality scene path. `source-product-images` is a
draft-only reference fallback and final visual QA rejects it. Scene tasks may include
`compositionGuidance`; it is a preference for art direction, not a deterministic rejection rule.

## Module scene brief

Every task includes a deterministic `sceneBrief` with:

- a paired subject mode: `scene-first` / `reference-only`, ShortcutRail-only
  `product-first` / `primary-subject`, or ThemeHero-only `scene-composite` /
  `locked-source-products`;
- the ThemeIntent shopping goal, needs, and conditions;
- the module shopping goal and reason;
- relevant selected categories and, when applicable, the exact PagePlan scene;
- the accepted content task ID and localized copy text;
- mandatory semantic evidence references and visual requirements.

For scene-first tasks, the generated environment and module theme are primary; assigned products are
references and need not be visible. Those scenes exclude bottles, jars, tubes, pumps, droppers,
sachets, and product boxes. Each ShortcutRail task instead has exactly one representative product:
the Host attaches its verified source image, the generator keeps it as the single primary subject near
the center with circular-crop margin, and category-relevant lifestyle context stays secondary. It must
preserve source identity and must not invent, rewrite, or add packaging, labels, logos, or claims.
A ThemeHero instead asks the Agent to derive a scene prompt from accepted Hero copy plus its assigned
product mix and generate only that background. The Host then composites the verified catalog product
images as locked source layers, preferring three to five products when available without blocking on
the count. The Agent chooses the camera, support surface, depth pattern, materials, and light from the
evidence while preserving natural environmental shadows. The background is rejected for steep or
internally inconsistent perspective, missing credible product footholds, a placement zone that forces
one flat row, or conflicting light and shadow directions. The Host keeps the central representative
product unobscured in front, staggers secondary products through middle and rear depths, and adds
restrained same-direction photographic contact shadows. Empty product silhouettes and empty
product-shaped shadows remain disallowed, but natural scene shadows do not. After inspecting the
background, the Agent may return a non-blocking placement plan with normalized x/y contact points,
scale, depth, primary index, and shadow direction. The Host uses valid guidance to follow the actual
generated surfaces. Every contact point is visually verified against the generated pixels and must
lie on an upward-facing supporting surface, never a vertical face, wall, or open air. Missing or
invalid guidance falls back safely and never blocks generation.
The combined group is centered and no principal element enters the bottom quarter. Scene elements
are Agent-selected from the evidence, so multi-category topics do not inherit a fixed skincare,
grocery, or other category prop template.
A Shortcut that exhausts native generation retries may use a source-backed lifestyle fallback with
the same one-product, centered-subject, circular-crop, identity-preservation, and secondary-context
rules; this task-level fallback must not discard other completed assets or block the page.
A Hero may likewise fall back to a neutral background plus the same locked real-product layers rather
than dropping the products or blocking the entire visual stage.
A direction is rejected when it omits any `sceneBrief.evidenceRefs`.

## Maintained image slots

| Component | Asset kind | Task granularity | Ratio | Minimum | Alt text | Background color |
| --- | --- | --- | --- | --- | --- | --- |
| `ThemeHero` | `hero-image` | one visible Hero | `16:9` | 1200×675 | required | required |
| `ShortcutRail` | `shortcut-image` | one source-backed product lifestyle image per assigned shortcut | `1:1` | 512×512 | `null` (decorative) | optional |
| `ThemeProductList` | `scene-image` | one per PagePlan scene | `1:1` | 1024×1024 | required | required |
| `BrandProductRail` | `brand-banner` | one per unique assigned brand | `111:40` | 888×320 | required | optional |

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
        "negativePrompt": "logos, unsupported claims, illegible text",
        "evidenceRefs": [
          "theme-intent:scenario:matcha",
          "product:matcha-1",
          "content-task:content-hero"
        ],
        "referenceProductIds": ["matcha-1"]
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

The example abbreviates the asset array. A real proposal must include every returned task in exact
order. `referenceProductIds` must equal the task product IDs in exact order.

## Evidence namespaces and scope

- `theme-intent:<evidence-id>` — exact ID from `themeIntent.evidenceRefs`.
- `selected-category:<category-id>` — exact returned selected-category ID.
- `product:<task-product-id>` — product assigned to the current visual task only.
- `scene:<task-scene-id>` — the current scene-image task's PagePlan scene only.
- `content-task:<module-content-task-id>` — the accepted content task attached to this visual task.

An accepted content task can itself contain `background:*` copy references. They are not part of
this list and must not be copied into a visual proposal.

Attach at least one reference to art direction and every required alt text. Evidence constrains the
direction; it does not authorize facts absent from the referenced artifact.

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

The deterministic module validates metadata and scope. Stage 06 must still open the actual files,
verify their bytes against the digest, render them in maintained components, inspect visual quality
and accessibility, and test responsive crops.

## Ready output

`topic-page-asset-manifest/v1` preserves the accepted assets, language, strategy and template refs,
all four upstream digests, and computes its own SHA-256 digest. It reports
`asset-manifest-ready`, not final-page or QA completion.
