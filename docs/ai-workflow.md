# AI direction workflow

Use Codex or Kiro to create a design direction, then import the resulting JSON
from the YAMI Canvas control panel. Canvas never sends prompts or project assets
to an external model.

## Agent prompt

```text
Create a YAMI Canvas DirectionManifestV1 JSON design direction.

Read:
- packages/contracts/src/manifest.ts
- apps/canvas/app/generated-direction.fixture.json
- docs/adr/001-architecture-and-migration-contract.md

Requirements:
- extends must be "current"
- use only the fixed home slots and five supported section kinds
- preserve an existing section's kind
- use shallow prop patches and full array replacement
- use only allowed semantic token overrides
- do not emit HTML, CSS statements, functions, React elements or external URLs
- return one JSON object with no Markdown fence
```

## Import behavior

- The browser validates `DirectionManifestV1` before saving anything.
- Invalid JSON leaves the current direction unchanged.
- Drafts are stored in `yami-canvas:drafts:v1` local storage.
- Exported files can be reviewed in Git and shared with the team.
- `current` always resolves from the Ecommerce Home fixture; it is never copied
  into a second manifest.
