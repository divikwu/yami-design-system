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

The CopyBrief may declare `templateCopy` for stable localized module chrome. Review those segments
for exact preservation and language consistency only. Do not require a comparison proposition from
the template label itself; evaluate dynamic Hero and scene copy, plus the module's bound product and
tab structure, for shopping usefulness. For a v3 brief, review the Hero against `heroStrategy`,
`topicSignature`, and `localizationStrategy`; accept v2 replay briefs without those fields. Evaluate
the Hero headline and description as a pair. Positioning lines, statements, actions, emotions,
questions, general verbs, definitions, or selection spans are all allowed when they form a natural,
useful, topic-specific proposition. Do not block on grammar, sentence count, literal keyword use, or
personal style alone. Treat empty interchangeable navigation, needless repetition, unnatural
localization, or unsupported sensory / quality / efficacy / outcome / origin claims as blocking
`language-quality` or `evidence-claim-alignment` issues. Request a clearer evidence-supported pair
without supplying replacement copy. The Hero module objective may also return locale-specific
`copyRules`: `preferredLength` is non-blocking guidance and may justify a warning, while the Host
owns the hard `maxCharacters` rejection. Do not return `revision-required` only because otherwise
natural copy sits outside a preferred range.

In a v3 brief, `explore-more.title` may be dynamic while its description remains template-owned.
Treat it as the only structural heading that may add one compact locale-native topic anchor near the
end of the page. Request revision when it repeats a neighboring topic keyword, restates the Hero,
adds multiple anchors, or becomes analytical prose. A concise generic title is valid when inserting
the topic would be unnatural.
