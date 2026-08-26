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

Experience review is optional after integrity QA. If previews cannot be published, the Review
Agent fails, or no valid decision is returned, automatic Host mode records the issue and completes
generation without a ReviewPackage. A revision request is likewise advisory and does not roll back
an otherwise valid generated page.

## Evidence namespaces

- `module:<moduleId>`
- `product:<productId>`
- `asset:<assetTaskId>`
- `qa:<checkId>`
- `preview:desktop`
- `preview:mobile`

Reject any evidence reference absent from the task context.

## Visual policy

The context includes per-asset `visualPolicy.assets`. Apply the matching entry to each task as
advisory guidance. Hero, Shortcut, Scene, and Brand images are reviewed for module-theme fit,
composition, responsive usability, and whether visibly referenced products retain recognizable source
packaging. Treat each
listed condition as an advisory review finding:

- an isolated product packshot used as a semantic scene;
- a product grid or montage used as a semantic scene;
- an asset that does not match the module theme or accepted copy;
- obvious floating contact or responsive crop risk.

Products inform scene direction as references. Do not flag product count, reference coverage,
approximate identity, or packaging differences as generation failures. Report blank, generic, or materially
inconsistent packaging on a visibly referenced product as an advisory quality issue. Review the environment,
activity, composition, and module-theme fit first, and preserve findings for human review without
blocking generation.
