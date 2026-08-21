# Topic Page Content Review proposal contract

Return exactly one object bound to the three digests in the review context:

```json
{
  "schemaVersion": "topic-page-content-review-proposal/v1",
  "contentSpecDigest": "sha256:...",
  "copyBriefDigest": "sha256:...",
  "backgroundEvidenceDigest": "sha256:...",
  "verdict": "revision-required",
  "issues": [
    {
      "code": "generic-theme-copy",
      "severity": "error",
      "moduleId": "hero",
      "message": "Explain the supported topic identity for a first-time shopper."
    }
  ]
}
```

Use `backgroundEvidenceDigest: null` when the context has no background artifact. `verdict` is
`approved` or `revision-required`. Approved output cannot contain error issues.
Revision-required output must contain at least one error issue. `code` is a lowercase kebab-case
identifier; `moduleId` is optional and, when present, must name a visible Topic module. Return at
most 20 issues and keep each message under 300 characters.
