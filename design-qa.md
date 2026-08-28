# Theme Hero mobile design QA

## Comparison target

- Source visual truth: `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-reference-scrolled.png`
  - W Concept mobile brand hero, focused on the full-bleed artwork and lower-left copy treatment.
- Rendered implementation: `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-after-mobile.png`
  - Storybook story: `yami-components-commerce-theme-hero--mobile`.
- Focused side-by-side comparison: `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-mobile-comparison.png`

## Viewport and normalization

- Requested browser viewport: `375 x 812` CSS px, device scale factor `1`.
- Source capture pixels: `495 x 1203`; the reference site enforces a `495px` minimum layout width. The focused hero region is `495 x 293` CSS/pixels.
- Implementation capture pixels: `423 x 812`; the rendered Theme Hero region is `423 x 400` CSS/pixels.
- Density normalization: both focused hero regions were downsampled to a common `375px` comparison width, preserving aspect ratio. They were centered on equal `375 x 400` canvases and joined into one `750 x 400` comparison image.
- The different hero heights are intentional: the YAMI version retains a longer English heading, three-line description, and CTA, while the reference contains shorter copy and no CTA.

## State

- Mobile breakpoint (`< 1024px`), light Storybook canvas, default Theme Hero content.
- Desktop styles were not changed.

## Full-view comparison evidence

- Source: `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-reference-scrolled.png`
- Implementation: `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-after-mobile.png`
- Both use a full-bleed campaign image, lower-left copy placement, white foreground content, and a dark lower image treatment for contrast.

## Focused comparison evidence

- `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-mobile-comparison.png`
- The combined comparison was inspected at original pixel dimensions. It confirms the same mobile composition pattern while preserving YAMI's product imagery, serif display type, copy, and CTA.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: YAMI's existing serif display heading and body typography are preserved; hierarchy and lower-left alignment match the reference intent. The description is clamped to three lines so artwork stays visible.
- Spacing and layout rhythm: the image is full-bleed, the copy is bottom-aligned using existing page-margin tokens, and the taller `360-400px` responsive band is an intentional content constraint rather than visual drift.
- Colors and visual tokens: the mobile-only black scrim provides the same lower-image contrast pattern as the reference without altering desktop tokens.
- Image quality and asset fidelity: the existing Anua campaign image is reused at full resolution with `object-fit: cover`; no placeholder or reconstructed asset is used.
- Copy and content: YAMI content is unchanged. The reference's Korean brand copy is used only as visual-layout guidance.
- Responsiveness and accessibility: selectable DOM text and the semantic CTA remain above the decorative image layers. The mobile Storybook play assertion verifies the full-bleed crop, bottom-aligned copy, hidden atmospheric duplicate, three-line clamp, and scrim.

## Interaction and runtime checks

- Primary CTA `Shop All Anua`: visible, enabled, and clickable.
- Storybook test suite: `34` files and `132` tests passed.
- Console review: no Theme Hero component exception was observed. Storybook emitted an existing manager-level `PopoverProvider` deprecation warning and `Illegal invocation` focus-runtime entries; both originate from Storybook manager/runtime bundles rather than the component story.

## Comparison history

1. Initial implementation evidence: `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-before-mobile.png`
   - P1: mobile used a stacked copy-and-image composition instead of the reference's single full-bleed image plane.
   - P2: the blurred atmospheric background reduced image clarity and the product artwork was visually separated from the narrative copy.
2. Fixes applied:
   - Made the mobile image cover the entire hero.
   - Anchored copy and CTA to the lower edge.
   - Added a mobile-only contrast scrim and hid the duplicate atmospheric layer.
   - Limited supporting copy to three lines.
3. Post-fix evidence:
   - `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-after-mobile.png`
   - `/Users/divikwu/diw/workspace/yami-design-system/theme-hero-mobile-comparison.png`
   - The second comparison found no remaining actionable P0/P1/P2 issues.

## Final result

passed

---

# Search results mobile filter rail edge QA

## Comparison target

- Source visual truth: `/var/folders/wk/b2pxrhkn49v_sb753kw8ktp80000gn/T/codex-clipboard-5f5ee523-d6cb-48fe-acfd-e2c4c071d1b6.png`
- Rendered implementation: `/Users/divikwu/diw/workspace/yami-design-system/search-results-mobile-rail-after.png`
- Focused implementation crop: `/Users/divikwu/diw/workspace/yami-design-system/search-results-mobile-rail-after-focus.png`
- Combined comparison: `/Users/divikwu/diw/workspace/yami-design-system/search-results-mobile-rail-comparison.png`

## Viewport and normalization

- Source pixels: `1136 x 322`; user-supplied annotated mobile crop showing both clipped rail edges.
- Implementation pixels: `1470 x 1257`; Storybook manager capture containing a `375 x 812` CSS-pixel mobile viewport at device scale factor `1`.
- Focused implementation pixels: `375 x 170`.
- Density normalization: the source was scaled to `170px` high and joined beside the focused implementation crop. Runtime CSS geometry was used for the exact inset checks.

## State

- Search Results `Mobile` story, light theme, initial horizontal rail position (`scrollLeft: 0`).
- Popular filters are unselected except for the story's default content; the comparison focuses on the rail boundaries rather than chip state.

## Full-view comparison evidence

- The rendered Storybook capture confirms the mobile header, controls rail, popular-filter rail, and product grid remain in their existing order and proportions.
- No unrelated mobile layout or product-list behavior changed.

## Focused comparison evidence

- Before: the scroll owner had no inline padding and could begin with the first chip at `x = -12px`, visibly clipping `Hot`; the opposite edge likewise had no owned terminal inset.
- After: the popular-filter scroll owner is `375px` wide with `12px` left/right padding and `12px` left/right scroll padding. The first chip begins at `x = 12px` with `scrollLeft: 0`.
- The combined comparison shows the first chip and its flame icon fully visible while retaining the partial next-chip cue that indicates horizontal scrolling.

## Findings

No actionable P0, P1, or P2 differences remain for this scoped rail-edge fix.

- Fonts and typography: existing `FilterChip` type styles, weights, and truncation behavior are unchanged.
- Spacing and layout rhythm: the `12px` mobile inset now belongs to the horizontally scrollable element, so both start and terminal spacing scroll with the chips.
- Colors and visual tokens: existing chip fills, borders, divider colors, and white toolbar surface are unchanged.
- Image quality and asset fidelity: existing YAMI icons and product images are unchanged; no replacement assets were introduced.
- Copy and content: filter labels and product data are unchanged.

## Interaction and runtime checks

- Horizontal scrolling remains enabled; the partial next chip continues to communicate overflow.
- TypeScript check: passed.
- Focused Search Results Storybook suite: `1` file and `5` tests passed.
- Browser console errors: `0`.
- The Mobile story now asserts `border-box`, `12px` inline padding, and `12px` inline scroll padding on the popular-filter rail.

## Comparison history

1. Initial evidence showed the first and last visible chips cut at the viewport boundaries because the outer section owned the inset while the inner element owned horizontal scrolling.
2. Fix applied: moved the `12px` inline inset to the scroll owner and added matching `scroll-padding-inline`.
3. Post-fix evidence shows the first chip fully visible at a `12px` inset with no regression to the mobile composition or scroll affordance.

## Final result

passed

---

# Search filters dialog Figma layout QA

## Comparison target

- Source visual truth: `/var/folders/wk/b2pxrhkn49v_sb753kw8ktp80000gn/T/codex-clipboard-b0d4fa62-2607-4eb1-b767-6c065b266525.png`
- Rendered implementation: `/Users/divikwu/diw/workspace/yami-design-system/search-filters-figma-after.jpg`
- Combined comparison: `/Users/divikwu/diw/workspace/yami-design-system/search-filters-figma-comparison.png`

## Viewport and normalization

- Source pixels: `2892 x 830`; Figma workspace crop showing the filter dialog layout and a `560 x 68` border-box row with `16px` horizontal and `12px` vertical padding.
- Implementation pixels: `1692 x 1257`; Storybook desktop-xl canvas at `1920 x 1080` CSS px inside the manager viewport.
- Density normalization: both full captures were scaled to `600px` height and joined into one comparison image. The key component dimensions were also verified from rendered CSS geometry rather than inferred from the scaled comparison.

## State

- Search Results story, light theme, all-filters dialog open, sections collapsed.
- Outline overlays are enabled in both the supplied Figma evidence and the Storybook verification capture.

## Full-view comparison evidence

- The combined image confirms the same full-width stacked section structure, dividers, summaries, expand controls, switch rows, modal hierarchy, and footer placement.

## Focused comparison evidence

- Rendered dialog: `560px` wide.
- Rendered body: `560px` wide with `0px` horizontal padding.
- Rendered main filter row: `560 x 68px`, with `12px 16px` internal padding.
- These measurements match the supplied Figma layer-property diagram: `528 x 44px` content plus `16px` left/right and `12px` top/bottom padding.

## Findings

No actionable P0, P1, or P2 differences remain for this scoped annotation.

- Fonts and typography: existing YAMI typography, weights, and hierarchy are unchanged.
- Spacing and layout rhythm: main rows now own the Figma padding and span the full dialog width; dividers align with the modal edges.
- Colors and visual tokens: existing surface, divider, text, and control tokens are unchanged.
- Image quality and asset fidelity: existing YAMI logo, icons, and product imagery are unchanged; no substitute assets were introduced.
- Copy and content: filter labels and summaries are unchanged.

## Interaction and runtime checks

- Filters trigger opens the dialog and the main filter sections remain interactive.
- TypeScript check passed.
- Search Results Storybook tests: `4/4` passed.
- Browser console errors: none.

## Comparison history

1. Earlier implementation put `16px` horizontal padding on the dialog body, reducing each main row to `528px` wide.
2. Fix applied: removed body horizontal padding and moved `12px 16px` padding onto main filter headers and switch rows.
3. Post-fix rendered evidence measures the row at `560 x 68px`, matching the Figma border-box model.

## Final result

passed

---

# Product Detail purchase card design QA

- Source visual truth: `/var/folders/wk/b2pxrhkn49v_sb753kw8ktp80000gn/T/codex-clipboard-2c98bdfa-a5d1-4aab-9b9a-c60070dad568.png`
- Browser implementation: `http://127.0.0.1:6006/iframe.html?id=yami-pages-product-detail--desktop-md-boundary&viewMode=story`
- Current grouped preview: `http://127.0.0.1:6006/iframe.html?id=yami-pages-product-detail-beauty--desktop-md-boundary&viewMode=story` (the evidence URL above predates the category grouping).
- Full-view evidence: `/Users/divikwu/.codex/visualizations/2026/08/21/01a02220-ec19-74f0-9770-8c1aa3efff5a/product-detail-three-sections-1432-viewport.png`
- Focused implementation evidence: `/Users/divikwu/.codex/visualizations/2026/08/21/01a02220-ec19-74f0-9770-8c1aa3efff5a/product-detail-purchase-card-three-sections-half.png`
- Combined comparison: `/Users/divikwu/.codex/visualizations/2026/08/21/01a02220-ec19-74f0-9770-8c1aa3efff5a/product-detail-purchase-card-comparison.png`
- Viewport: desktop, `1432 × 1257` CSS px, light theme, Product Detail `desktop-md-boundary` story
- Source pixels: `566 × 1050`
- Implementation region: `240 × 522` CSS px; focused browser capture `120 × 261` px at the browser backend's 0.5 capture scale, enlarged 4× only for the combined visual comparison
- State: default seller card with three guarantees, three visible tags, and collapsed tag disclosure

## Findings

No actionable P0, P1, or P2 differences remain for the requested structural change.

- Fonts and typography: existing YAMI typography, weights, wrapping, and content are preserved. The source is a zoomed annotation, so its apparent text scale is not treated as a component-size target.
- Spacing and layout rhythm: the seller/shipping, guarantees/details, and tags/disclosure content now occupy exactly three direct sections. Each section has `16px` padding; sections two and three have a `1px` semantic divider. The outer card remains `240px` wide with a `2px` border, `8px` radius, and no internal padding.
- Colors and tokens: borders and dividers use existing semantic tokens. The green guarantee icons intentionally preserve the preceding approved change and therefore differ from the older black-icon reference.
- Image and asset fidelity: the existing YAMI seller logo and three shipped design-system icons are reused; no substitute or generated assets were introduced.
- Copy and content: seller, shipping, delivery, guarantee, details, tag, and disclosure copy remain unchanged and in the same order.
- The red rounded rectangles in the source are annotation marks describing the three groups, not UI decoration, so they are intentionally absent from the implementation.

## Interaction and runtime evidence

- Product Detail Storybook interaction suite: 6 of 6 tests passed.
- Direct-child structure, section padding, divider widths, outer border, and radius were verified through browser-computed styles.
- Browser console errors: none.
- Existing quantity, gallery, tag disclosure, and purchase interactions remain covered by the story interaction test.

## Comparison history

- Pass 1: the requested three-section hierarchy, spacing, dividers, content order, assets, and token usage matched the reference intent. No P0/P1/P2 fix loop was required.

## Follow-up polish

No P3 follow-up is required for the requested scope.

final result: passed
