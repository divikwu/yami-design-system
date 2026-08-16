**Comparison target**

- Source visual truth: `browser://comment-1`, including the user-selected expanded workflow table, detailed workflow-step summary, and simplified workflow nodes at the current Topic Generator desktop viewport.
- Intended implementation: `http://127.0.0.1:3200/topic-generator?content-language=zh&selection-strategy=relevance`, `详细版`, stage 01 expanded.
- Requested state: both the field labels and values inside `.workflowDetails` use 12 px type, with 12 px vertical cell padding; remove the unintended grid gap between the two desktop columns without changing either cell's internal padding. In the workflow-step summary, make the stage number match the gray description typography and use 4 px vertical gaps between number, title, and description.

**Findings**

- The source target is available and the owning CSS now sets both `dt` and `dd` to `font-size: 12px`, `line-height: 16px`, and 12 px vertical padding.
- The stage number and gray description now share the same color, font size, and line height; `.workflowSummaryCopy` uses a uniform 4 px row gap.
- Simplified workflow nodes now use the order icon, stage number, title; the stage number and title share one typography rule.
- Simplified workflow stage numbers are centered within their fixed 28 px grid track without changing neighboring spacing.
- A current browser-rendered implementation screenshot could not be captured because the in-app browser blocked reloading the local URL under its URL security policy.
- Without a post-change rendered capture, visual comparison and final design QA cannot be completed.

**Required fidelity surfaces**

- Fonts and typography: source code uses a unified 12 px size and 16 px line height for table labels and values. The workflow stage number now reuses the gray description's body typography instead of the earlier mono caption style; rendered fidelity is unverified.
- Spacing and layout rhythm: desktop labels and values both retain `12px 16px`, and the label track remains 132 px so longer labels do not wrap. A higher-specificity `.workflowTrace .workflowDetails div` rule now overrides `.trace li div { gap: 5px; }` with `gap: 0`, removing the actual inter-cell gap. The mobile stack continues to use 12 px on all sides. Workflow summary copy uses 4 px vertical gaps.
- Colors and visual tokens: no color or token rules were changed.
- Image quality and asset fidelity: no image assets are involved.
- Copy and content: unchanged.

**Runtime evidence**

- `pnpm --filter @yami/canvas typecheck`: passed.
- `pnpm --filter @yami/canvas test`: 17 tests passed.
- Browser-rendered screenshot and console check: blocked by local URL policy.

**Implementation checklist**

- [x] Unify detail-table label and value font size at 12 px.
- [x] Use a shared 16 px line height.
- [x] Unify label and value vertical padding at 12 px across desktop and mobile.
- [x] Override the inherited desktop grid gap with sufficient selector specificity while preserving the 132 px label track and both columns' internal padding.
- [x] Match the stage number typography to the gray description and set the summary copy gap to 4 px.
- [x] Move the simplified-flow stage number between the icon and title, and share the title typography rule.
- [x] Center each simplified-flow stage number within its grid track.
- [x] Pass Canvas typecheck and tests.
- [ ] Capture and compare the updated browser state after the local page can be refreshed.

final result: blocked
