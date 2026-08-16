**Comparison target**

- Source visual truth: Browser Comment 1 additional labeled reference image (conversation attachment, simplified vertical 01–08 workflow with rollback branches; visible source image 1512 × 1727 px).
- Rendered implementation: `/Users/divikwu/diw/workspace/yami-design-system/apps/canvas/topic-generator-workflow-tabs-viewport.png`.
- Combined comparison: `/Users/divikwu/diw/workspace/yami-design-system/apps/canvas/topic-generator-workflow-tabs-comparison.png`.
- Viewport: 1512 × 1256 CSS px, devicePixelRatio 2, light theme, Simplified Chinese, waiting-input state.
- Implementation capture: 1512 × 1256 px browser-rendered screenshot. The reference is a structural target rather than a pixel-identical page mock, so both were normalized to equal-width columns for composition review; spacing and typography were also reviewed from the full-size implementation capture.

**Findings**

- No actionable P0, P1, or P2 findings remain.
- The implementation preserves the source hierarchy: eight serial nodes, explicit 06 QA and 07 Review gates, and visible local rollback destinations.
- The implementation intentionally uses square Canvas workstation surfaces instead of the reference image's rounded boxes. This follows the existing product UI and the earlier straight-edge requirement.
- Rollbacks are summarized beside stages 06 and 07 instead of drawing long crossing arrows. This keeps the compact diagram legible while preserving the same routing semantics.

**Required fidelity surfaces**

- Fonts and typography: existing Yami/Canvas tokens are retained; stage labels, monospace numbers, status tags, and Chinese/English labels remain readable without unintended wrapping.
- Spacing and layout rhythm: the internal tabs, centered 480 px nodes, 32 px connectors, and side rollback notes form a consistent vertical rhythm. The page remains within the 1512 px viewport.
- Colors and visual tokens: white surfaces, neutral borders, black active-tab indicator, subdued metadata, green automatic state, and black user-input state all reuse existing semantic tokens.
- Image quality and asset fidelity: the workflow contains no raster imagery. All functional icons use Hugeicons and remain crisp at the rendered density.
- Copy and content: the simplified view uses the same 01–08 labels and execution boundaries as the detailed view; QA rollback and Review change-request rules are retained.

**Interaction and runtime evidence**

- Default internal tab: `流程图` selected.
- `详细版` interaction: selected successfully and rendered 8 expandable summaries.
- Return interaction: `流程图` selected successfully and rendered 8 nodes.
- Rollback labels: `QA 未通过` and `要求修改` both visible.
- Browser console: no error-level logs.
- Disabled top-level result tabs remain unchanged in waiting-input state.

**Responsive evidence**

- Desktop browser capture verified at 1512 × 1256 CSS px.
- Existing responsive rules move rollback notes below their owning node at ≤1120 px and collapse node status to a second row at ≤600 px.
- No separate mobile screenshot was required because the supplied visual target is desktop-only; the owning responsive rules were inspected for overflow-sensitive regions.

**Comparison history**

- Initial implementation comparison: no actionable P0/P1/P2 mismatch found; no visual correction iteration was required.

**Implementation checklist**

- [x] Add internal `流程图 / 详细版` tabs.
- [x] Default to the simplified diagram.
- [x] Render eight ordered workflow nodes with Hugeicons and connectors.
- [x] Surface QA and Review rollback destinations.
- [x] Preserve the existing expandable detailed workflow.
- [x] Verify tab interaction, node counts, rollback text, and browser console.

**Follow-up polish**

- None required for this scoped change.

**Detailed content table iteration — 2026-08-16**

- Source visual truth: `browser://comment-1` — the user-selected expanded detail region at 1512 × 1256 px, annotated to request a bordered or gray content table.
- Rendered implementation: `/Users/divikwu/diw/workspace/yami-design-system/apps/canvas/topic-generator-workflow-details-table.png`, captured at 1512 × 1256 CSS px, devicePixelRatio 2, light theme, Simplified Chinese, `详细版` selected and stage 01 expanded.
- Comparison input: the browser-comment source capture and the emitted browser-rendered implementation screenshot were reviewed together in this task. No density normalization was required because both represent the same desktop viewport and state.
- Focused-region evidence: the expanded stage 01 table is legible in the full-size implementation capture; it shows three rows with a 132 px gray label column, white content cells, a 1 px outer border, and 1 px row separators.
- Fonts and typography: existing caption/body tokens remain unchanged; field labels are visually subordinate without reducing readability.
- Spacing and layout rhythm: each desktop row uses 14 × 16 px cell padding; the mobile rule stacks labels and values with 10 × 12 px and 12 px padding respectively.
- Colors and visual tokens: the label column uses `--surface-secondary`; borders use `--border-default`; content remains on `--surface-primary`.
- Image quality and asset fidelity: no raster or decorative image assets are involved in this scoped table treatment.
- Copy and content: input, action, output, and optional rollback values are unchanged.
- Interaction evidence: `详细版` remained selected, stage 01 remained expanded, and all three content rows were present after reload.
- Runtime evidence: TypeScript passed, 17 tests passed, and the in-app browser reported no error-level console logs.
- Findings: no actionable P0, P1, or P2 differences remain. The result satisfies the requested table treatment without changing workflow data or disclosure behavior.
- Comparison history: the original open region read as a loose vertical definition list; the fix added an outlined two-column table with gray field cells; the post-fix browser capture confirmed the requested visual hierarchy.

**Table top-spacing iteration — 2026-08-16**

- Source visual truth: `/var/folders/wk/b2pxrhkn49v_sb753kw8ktp80000gn/T/codex-clipboard-17713be0-17f6-4ea9-bfc0-6bef4ff6b5f4.png` (2296 × 590 px), with the requested space above the expanded detail table highlighted.
- Rendered implementation: `/Users/divikwu/diw/workspace/yami-design-system/apps/canvas/topic-generator-workflow-details-spacing.png` (1512 × 1256 px), captured from the in-app browser at a 1512 × 1256 CSS px viewport, devicePixelRatio 2, light theme, Simplified Chinese, `详细版` selected, stage 01 expanded.
- Combined comparison: `/Users/divikwu/diw/workspace/yami-design-system/apps/canvas/topic-generator-workflow-details-spacing-comparison.png`. The reference and focused implementation region were normalized to 1200 px width and reviewed together.
- Focused-region evidence: browser geometry measured a 16 px gap from the stage summary bottom to the table top. The gap is visibly present without weakening the association between the summary and its expanded content.
- Fonts and typography: unchanged; table labels and values retain the existing Canvas/Yami type tokens.
- Spacing and layout rhythm: desktop top margin is 16 px; the existing mobile breakpoint uses 12 px. Horizontal margins, cell padding, row height, and stage-to-stage spacing are unchanged.
- Colors and visual tokens: unchanged; the table continues to use the existing primary/secondary surfaces and default border token.
- Image quality and asset fidelity: no product or decorative image assets are involved in this scoped spacing change.
- Copy and content: unchanged.
- Runtime evidence: `pnpm --filter @yami/canvas typecheck` passed; 17 Canvas tests passed; the in-app browser reported no error-level console logs.
- Findings: no actionable P0, P1, or P2 differences remain. The scoped visual target is satisfied on desktop and has a proportionate mobile rule.
- Comparison history: the first post-change comparison passed; no further visual correction was required.

final result: passed
