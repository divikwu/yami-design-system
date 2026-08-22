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
Require `rollbackStage` for every blocking issue.

## Recommendations

- `recommend-approval`: allow warnings, forbid blocking issues.
- `request-revision`: require at least one blocking issue.

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

The context includes `visualPolicy`. Treat each listed condition as blocking:

- an isolated product packshot used as a semantic scene;
- a product grid or montage used as a semantic scene;
- an asset that does not match the module theme or accepted copy;
- generated or altered visible product packaging.

Products may inform scene direction but are references only. Review the environment, activity,
composition, and module-theme fit first. Bind failures to `visual-generation`.
