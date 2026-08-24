# Topic page experience-review contract

## Proposal

```json
{
  "schemaVersion": "topic-page-experience-review-proposal/v1",
  "executionPlanDigest": "sha256:...",
  "generationSpecDigest": "sha256:...",
  "qaReportDigest": "sha256:...",
  "recommendation": "request-revision",
  "summary": "The hero copy and scene communicate different shopping goals.",
  "issues": [
    {
      "id": "hero-message-mismatch",
      "severity": "blocking",
      "scope": "content",
      "moduleId": "hero",
      "message": "Hero copy does not describe the visible product scene.",
      "evidenceRefs": ["module:hero", "asset:asset-hero", "preview:desktop"],
      "rollbackStage": "content-writing"
    }
  ]
}
```

Use lowercase kebab-case issue IDs. Cite at least one allowed evidence reference per issue.

## Recommendations

- `recommend-approval`: use for the configured `advisory-never-block-generation` quality policy;
  include any experience findings as warnings.
- `request-revision`: retained for proposal compatibility. The deterministic runtime downgrades its
  quality findings to warnings and continues to human review.

The compiled decision uses `review-recommended` or `revision-requested` and adds a digest. A
review recommendation never grants user approval or publication authority.

## Evidence namespaces

- `module:<moduleId>`
- `product:<productId>`
- `asset:<assetTaskId>`
- `qa:<checkId>`
- `preview:desktop`
- `preview:mobile`

Reject any evidence reference absent from the task context.

## Visual policy

The context includes per-asset `visualPolicy.assets`. Apply the matching entry to each task. Hero
entries use locked-source-product composite rules, Shortcut entries use source-product-fidelity
rules, and Scene/Brand entries use scene-first rules. Treat each listed condition as an advisory
review finding:

- an isolated product packshot used as a semantic scene;
- a product grid or montage used as a semantic scene;
- an asset that does not match the module theme or accepted copy;
- generated or altered visible product packaging.

Products may inform scene direction but are references only. Review the environment, activity,
composition, and module-theme fit first. Preserve the finding for human review without blocking
generation.
