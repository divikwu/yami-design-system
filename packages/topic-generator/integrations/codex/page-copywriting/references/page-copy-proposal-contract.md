# General page copy proposal contract

Read this contract only when no caller schema is available and the response
contains multiple copy fields, repeated entries, or modules intended for machine
reuse. A caller-provided schema remains authoritative.

## Proposal shape

Return one JSON object with these fields:

- `schemaVersion`: exactly `page-copy-proposal/v1`;
- `pageId`: the caller's page ID, unchanged;
- `locale`: the requested locale, unchanged;
- `status`: `draft` or `ready-for-review`;
- `assumptions`: explicit assumptions, in decision order;
- `modules`: requested modules in caller order;
- `warnings`: unsupported or unresolved requests.

Each module contains its unchanged `moduleId` and an ordered `bindings` array.
Each binding contains:

- `fieldPath`: the exact copy field, such as `title`, `tags[]`,
  `items[].label`, `scenes[].description`, or `groups[].label`;
- `text`: the proposed customer-facing copy;
- `evidenceRefs`: only caller-authorized evidence IDs;
- `position`: the zero-based caller position for every repeated `[]` path;
- `bindingId`: the caller's stable entry ID when the repeated entry already
  exists, such as an assignment `slotId`, `sceneId`, or `groupId`.

Omit `position` and `bindingId` for scalar fields. For generated ordered values
without upstream IDs, such as Hero tags, include `position` and omit
`bindingId`. For caller-owned repeated entries, include both. Never invent a
replacement ID, use array position as identity, or collapse repeated entries
into a single string.

Within a module, order bindings by the caller's copy-slot order. Keep all fields
for one repeated entry together, and order those entries by their caller
position. A consumer reconstructs the page by matching `moduleId`, assigning
scalar `fieldPath` values directly, and applying repeated paths to the entry
identified by `bindingId` at `position`.

## Maintained module bindings

When the shared page module contract applies, use these exact paths and IDs:

| Module | Field paths | Repeated binding |
| --- | --- | --- |
| `hero` | `title`, `description`, `tags[]` | tag `position`; no invented tag ID |
| `shortcuts` | `title`, `items[].label` | assignment `slotId` as `bindingId` plus assignment position |
| `start-here` | `title`, `scenes[].label`, `scenes[].title`, `scenes[].description` | `sceneId` as `bindingId` plus scene position |
| `popular-picks` | `title`, `groups[].label` | `groupId` as `bindingId` plus group position |
| `brand-spotlight` | `title` | no generated brand identity binding |
| `explore-more` | `title`, `description`, `groups[].label` | `groupId` as `bindingId` plus group position |

Do not return `reviews` unless the caller supplied verified review records and
explicit review copy fields. For an unfamiliar module, preserve its caller
field names as `fieldPath` values and apply the same scalar/repeated binding
rules.

## Complete maintained-page example

For a machine-readable example covering every currently supported maintained
module and copy slot, read
[the complete proposal example](page-copy-proposal.example.json). The example
demonstrates structure and bindings, not reusable customer claims.

Return `ready-for-review` only when every requested field appears exactly once,
every repeated entry retains its ID and position, module order is unchanged,
template-owned copy is verbatim, and all factual text fits the allowed evidence.
Otherwise return `draft` with explicit assumptions or warnings.
