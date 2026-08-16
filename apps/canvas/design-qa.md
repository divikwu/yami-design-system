# Canvas device tab design QA

## Comparison target

- Source visual truth: `browser-comment://localhost:3200/workbench/device-tab/reference-2`
  - User-attached `Preview / Code` segmented-tab reference, shown in the current browser comment at `516 x 200` pixels.
- Rendered implementation: `/tmp/yami-canvas-segmented-full.png`
  - Canvas workbench route: `/workbench?path=%2F&direction=current&locale=en&theme=light&viewport=360`.

## Viewport and normalization

- Browser viewport and implementation capture: `1636 x 1257` CSS/pixels at density `1`.
- Rendered control: `267 x 36` CSS pixels at `x=20`, `y=372.5`.
- The source is an isolated style reference rather than a same-width product mock. Comparison therefore normalizes the control pattern: inset selected surface, neutral container, typography hierarchy, corner treatment, and absence of elevation.

## State

- Canvas desktop workbench, light theme, phone device tab selected.
- The iframe prototype and its storefront styling are outside this comparison.

## Full-view comparison evidence

- Source: user-attached segmented-tab reference in the current browser comment.
- Implementation: `/tmp/yami-canvas-segmented-full.png`.
- The implementation uses the same light neutral trough and inset white selected surface while preserving the Canvas device labels and compact density.

## Focused comparison evidence

- The device control is visible at original scale in `/tmp/yami-canvas-segmented-full.png` at `x=20`, `y=372.5`, `267 x 36` pixels.
- A separate enlarged crop was not needed because the control and text are readable at 1:1 density; computed styles were checked on the same rendered element.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the existing Canvas UI font is preserved; selected text uses medium emphasis while inactive text remains secondary.
- Spacing and layout rhythm: the control remains `36px` high with a `3px` inset, `2px` option gap, `12px` container radius, and `8px` selected radius.
- Colors and visual tokens: the trough is neutral `#f5f5f5`, the selected surface is white, and text uses existing primary/secondary tokens.
- Shadows and elevation: container and selected item both compute to `box-shadow: none`; borders and dividers are removed.
- Image quality and asset fidelity: the Canvas device tabs contain no image assets. The reference icons are content-specific and intentionally not copied into the existing device labels.
- Copy and content: `手机 / 平板 / 桌面` are unchanged.

## Interaction and runtime checks

- Native radio-group semantics are preserved.
- Clicking a device tab updates the selected state and the `viewport` URL parameter; phone and tablet states were checked in the in-app browser.
- No Canvas console warnings or errors were present after interaction.
- Typecheck, targeted ESLint, and diff whitespace checks passed.

## Comparison history

1. Initial state:
   - P2: selected tab used a solid black fill with white text, unlike the inset white surface in the reference.
   - P2: the group had an outer border and vertical dividers, adding visual weight absent from the reference.
2. Fixes applied:
   - Replaced the bordered white group with a neutral rounded trough.
   - Added an inset white selected surface with primary text.
   - Removed outer border, dividers, and all shadows.
3. Post-fix evidence:
   - `/tmp/yami-canvas-segmented-full.png`
   - Computed styles: `#f5f5f5` trough, white selected surface, `12px / 8px` radii, `0px` border, and `none` shadow.

## Final result

passed
