# Topic Page Content Review proposal contract

## Candidate package selection

For a `topic-page-content-candidate-selection-run/v1` with status
`needs-candidate-selection-proposal`, return exactly one object bound to the supplied accepted
candidate set:

```json
{
  "schemaVersion": "topic-page-content-candidate-selection-proposal/v1",
  "candidateSetDigest": "sha256:...",
  "selections": [
    {
      "moduleId": "hero",
      "candidateId": "candidate-2",
      "reason": "The clearest evidence-supported proposition for a newcomer."
    },
    {
      "moduleId": "start-here",
      "candidateId": "candidate-4",
      "reason": "The scenes form the most useful and coherent shopping path.",
      "sceneSelections": [
        {
          "sceneId": "page-scene-1",
          "candidateId": "candidate-5",
          "reason": "This scene gives the clearest supported decision."
        }
      ]
    }
  ]
}
```

Preserve target-module order and choose exactly one base package for each target module. Candidate
IDs must exist in the supplied set. Hero and Start Here may come from different candidates. Start
Here may include optional whole-scene selections for an existing `sceneId`; all other fields remain
from the chosen base package. The selector cannot rewrite copy, combine fields within a scene or
Hero, alter evidence, or omit a target. Compare every package using the supplied criteria and judge cross-module
coherence before returning concise reasons under 300 characters. When Start Here packages are
otherwise equally useful and supported, prefer module titles, scene labels, scene titles, and
descriptions that meet their returned locale-specific `preferredLength`. Keep the heading broad
enough for the whole journey and tab labels short and distinct; do not enumerate every category
already visible in the product row or truncate meaningful words merely to fit.
Treat Hero tags as evidence-bound browsing labels; do not select first / next / last sequencing
language when the cited evidence establishes category presence but not a care order.

Use every entry in `selectionPolicy.advisoryCriteria` to prefer the strongest available copy, and
compare every candidate with its `direction.objective`. For Brand briefs, prefer a supported brand
position, idea, or other point of distinction over generic identity plus instructions for browsing
the page. Apply `topic-anchor-visibility` as a non-blocking preference: among comparably supported,
natural, and useful Brand packages, prefer the headline that includes the canonical brand keyword
once. Meta-navigation, repetition, and a missing headline anchor are advisory weaknesses, not hard gates. Always return one base
selection per target; the Host falls back to the first structurally valid package if the selection
payload is invalid, and ignores only invalid optional scene picks.

For an unfamiliar Brand audience, prefer a supported, natural brand-positioning capsule that uses
the Hero pair to explain what the brand is through category or identity context, what distinguishes
it, and why it matters to the shopper. Rank it above a comparably supported but abstract concept,
without automatically selecting the `brand-position` direction or requiring a colon. Among equally
strong positioning packages, prefer one whose headline itself states the brand, category or
identity, and distinction over abstract wrapper labels such as brand promise, concept, approach,
“主张,” “构思,” or “视角.” For Chinese, prefer a colon when it prevents stacked analytical nouns,
and prefer a description that connects the distinction to two or three supported shopper needs or
choice benefits instead of a category inventory. Prefer Brand
tags that contribute distinct supported axes such as signature ingredient or concept, formulation
or position, and shopper need or category. Treat `effective` / “有效” as evidence-bound efficacy
language; absent support, prefer neutral targeted or need-led wording. All of these remain advisory
selection preferences and never permit omitting a required selection.

Apply `brand-category-orientation` as another non-blocking preference. When one precise category
clearly represents the brand and is supported, prefer it in the headline. For a multi-category
brand, prefer the narrowest accurate supported umbrella category or identity instead of falsely
narrowing the brand or enumerating its taxonomy. When no umbrella identity is supported, prefer a
brand-and-distinction headline and leave a few representative categories to the description, tags,
and category navigation. Missing or imperfect category orientation never permits omitting a
required selection and is not a structural error.

## Final ContentSpec review

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

`qualityPolicy: advisory-optimize-never-block` means this verdict controls only one bounded
optimization attempt. If the rewrite is still imperfect, unavailable, or the review response is
invalid, the Host converts semantic findings to warnings and continues with the latest structurally
valid ContentSpec. Length guidance never creates an error. Digest and immutable-artifact validity
remain Host-owned structural checks rather than subjective quality thresholds.

The CopyBrief may declare `templateCopy` for stable localized module chrome. Review those segments
for exact preservation and language consistency only. Do not require a comparison proposition from
the template label itself; evaluate dynamic Hero and scene copy, plus the module's bound product and
tab structure, for shopping usefulness. For a v3 brief, review the Hero against `heroStrategy`,
`topicSignature`, and `localizationStrategy`; accept v2 replay briefs without those fields. When
`localizationReference` is present, compare matching module and scene IDs with the reference locale
and preserve the same shopper need, proposition, and decision in natural target-locale writing.
Evaluate
the Hero headline and description as a pair. Positioning lines, statements, actions, emotions,
questions, general verbs, definitions, or selection spans are all allowed when they form a natural,
useful, topic-specific proposition. Do not block on grammar, sentence count, literal keyword use, or
personal style alone. For Brand briefs, prefer the canonical brand keyword once in the headline
when natural, and prefer the most precise truthful category orientation, but treat either absence
alone as a warning rather than `revision-required`. Treat empty interchangeable navigation, needless repetition, unnatural
localization, or unsupported sensory / quality / efficacy / outcome / origin claims as blocking
`language-quality` or `evidence-claim-alignment` issues. Request a clearer evidence-supported pair
without supplying replacement copy. The Hero and Start Here module objectives may also return
locale-specific `copyRules`: `preferredLength` is non-blocking guidance and may justify a warning,
while `maxCharacters` is also only a recommended layout ceiling. For Start Here, prefer a compact
decision phrase plus one short description sentence over an exhaustive category list. Do not
return `revision-required` only because otherwise natural copy sits outside either length target.

Treat a Hero that explains page mechanics or repeats the visible category inventory as blocking
`meta-navigation-avoidance` or `module-redundancy-avoidance`. For a Brand v3 brief, require an
evidence-supported point of distinction when the eligible evidence contains one; brand identity
alone is context, not necessarily the proposition.

In a v3 brief, `explore-more.title` may be dynamic while its description remains template-owned.
Treat it as the only structural heading that may add one compact locale-native topic anchor near the
end of the page. Request revision when it repeats a neighboring topic keyword, restates the Hero,
adds multiple anchors, or becomes analytical prose. A concise generic title is valid when inserting
the topic would be unnatural.
