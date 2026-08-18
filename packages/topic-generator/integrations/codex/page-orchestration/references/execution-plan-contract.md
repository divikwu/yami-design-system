# LandingPage execution-plan contract

## Proposal

Return exactly one object:

```json
{
  "schemaVersion": "landing-page-execution-plan-proposal/v1",
  "keyword": "ANUA",
  "site": "us",
  "language": "zh",
  "themeIntentDigest": "sha256:...",
  "requestedPageTypeRef": null,
  "requestedSelectionStrategyRef": "relevance/default@1",
  "pageTypeRef": "landing-page/brand@2",
  "selectionStrategyRef": "relevance/default@1",
  "templateRef": "topic-landing/relevance@1",
  "reason": "Use the registered brand route requested by the caller."
}
```

Copy the identity and caller-constraint fields from the task. Select `pageTypeRef`,
`selectionStrategyRef`, and `templateRef` only as one exact route exposed in
`context.pageTypes[].routes`.

## Compiled plan

The deterministic runtime adds:

- `status: execution-ready`;
- `workflowRef`;
- the registered stage graph and actor for every stage;
- per-stage maximum attempts;
- allowed Review rollback stages;
- a SHA-256 digest.

Never add these fields to the Agent proposal or reproduce their rules outside the runtime.

## Failure behavior

Stop and report the runtime issues when:

- ThemeIntent is unresolved;
- the page type does not support the ThemeIntent type;
- an explicit-only page type was not requested;
- the caller constraint was changed or dropped;
- a strategy or template is absent from its registry;
- the selected strategy-template pair is not a declared route;
- any identity or digest binding is stale.
