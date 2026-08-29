---
name: content-writing
description: Compatibility alias for older Topic page copy prompts. Use only when a saved workflow explicitly invokes content-writing; use page-copywriting for all new page copy generation and rewriting tasks.
---

# Content Writing compatibility alias

This Skill name is retained so saved prompts do not break. For all new work,
load and follow the independent
[`page-copywriting` Skill](../page-copywriting/SKILL.md).

When the caller supplies a Topic Generator `content-writing` stage, use
`page-copywriting` in Topic Generator mode. Preserve the stage name,
`TopicPagePlan`, task IDs, digests, evidence scope, and response schema exactly;
the compatibility alias does not define a second writing contract.
