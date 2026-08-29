# Shared page module copy contract

Use this contract when a page brief contains any of the maintained module IDs
below. Preserve the caller's module visibility, IDs, order, assignments, scene
IDs, group IDs, and product membership. The Skill writes only the listed copy.
When no caller schema is available, encode these slots using the exact field
paths and binding rules in the
[general proposal contract](page-copy-proposal-contract.md).

| Module ID | Module purpose | Supported copy |
| --- | --- | --- |
| `hero` | Establish the page proposition and orient the shopper | `title`, `description`, 2–4 `tags` |
| `shortcuts` | Provide concise category or destination entry points | template-owned `title`; one `items[].label` per assignment `slotId` |
| `start-here` | Guide a newcomer through distinct situations or decisions | whole-module `title`; one `scenes[].label`, `scenes[].title`, and `scenes[].description` per scene ID |
| `popular-picks` | Present frozen popular or primary product groups | template-owned `title`; one locale-native `groups[].label` per group ID |
| `brand-spotlight` | Present frozen brand groups | template-owned `title`; no invented brand identity copy |
| `reviews` | Present verified customer review records | unavailable unless the caller supplies verified review records and explicit copy slots |
| `explore-more` | Close with additional frozen product groups | compact generated `title`; template-owned `description`; one locale-native `groups[].label` per group ID |

## Template-owned copy

When Topic Generator or another caller selects the maintained localized chrome,
copy these values exactly instead of rewriting or translating them. These values
mirror Topic Generator's runtime `topicPageTemplateCopy`; contract tests must
fail if either source changes without the other.

| Module | `zh` | `en` |
| --- | --- | --- |
| `shortcuts.title` | `精选分类` | `Featured Categories` |
| `popular-picks.title` | `热门精选` | `Popular Picks` |
| `brand-spotlight.title` | `精选品牌` | `Featured Brands` |
| `explore-more.description` | `浏览更多商品选择。` | `Browse more product options.` |

Caller-supplied `templateCopy` always overrides this table and remains
immutable. Do not inject these headings into a page that does not request the
corresponding module.

## Module content rules

- Treat the Hero headline and description as one proposition. Tags add distinct
  supported browsing directions; they are not a sequence of promised results.
- Keep every Shortcut label bound to its exact assignment `slotId`. Generate no
  extra labels and never reorder them.
- Make `start-here.title` describe the whole journey. Each scene label is a
  compact tab name; each scene title names a decision; each description adds
  one useful comparison or next step without repeating the visible product row.
- Keep Popular Picks and Explore More group labels bound to exact group IDs,
  order, and membership. Labels describe the group but never redefine it.
- Keep Brand Spotlight identity catalog-derived. Do not infer brand claims from
  the module name or its product mix.
- Keep Reviews absent when verified records are unavailable. Never synthesize a
  quote, reviewer identity, rating, or customer outcome.
- Let `explore-more.title` use at most one light topic anchor. Do not repeat the
  Hero or enumerate the whole page taxonomy near the end of the page.

For Topic Generator requests, the stricter Topic Page workflow and proposal
contract remain authoritative for evidence references, candidate packages,
digests, locale enforcement, and deterministic validation.
