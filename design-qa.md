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

---

# Shortcut Rail PC image-card design QA

- Source visual truth: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/01-figma-reference.png`
- Storybook implementation: `http://127.0.0.1:6006/iframe.html?id=yami-pages-topic-landing-page-topic--pc-image-card-categories&viewMode=story&globals=locale%3Aen`
- Focused implementation evidence: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/31-storybook-image-card-row-gap-24-focus.jpg`
- Combined comparison: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/32-reference-vs-storybook-row-gap-24.jpg`
- Mobile implementation evidence: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/33-storybook-mobile-image-card-64.png`
- PC minimum-width evidence: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/34-storybook-pc-image-card-min-width-160.png`
- PC six-item evidence: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/35-storybook-pc-six-image-cards.png`
- PC six-item paging and mask evidence: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/39-storybook-pc-six-image-card-mask-layer.png`
- PC six-item centered-control evidence: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/40-storybook-pc-six-image-card-control-centered.png`
- PC seven-item fallback evidence: `/Users/divikwu/.codex/visualizations/2026/09/02/01a06227-eaa1-7363-9849-f7df70b1169d/category-module-audit/36-storybook-pc-seven-compact-entries.png`
- Viewport and state: desktop, `1455 x 1257` CSS px, light theme, English locale, five categories
- Intentional source change: the image remains in the shortened `4:3` frame with its square source centered vertically. The section title keeps the existing Topic page typography.

## Findings

No actionable P0, P1, or P2 differences remain for the requested variant.

- Typography: category labels render over the lower image edge at `16px / 20px`, weight `400`, left aligned, and size naturally to one or two lines.
- Spacing and layout: the title-to-card row gap is `24px`; the five items use the first five tracks of a six-column `1344px` grid. Each visible frame is approximately `211 x 158px` at a `4:3` ratio with a `16px` column gap and `8px` radius, leaving one intentional track after the final entry.
- Colors and tokens: the titled module keeps the existing `--surface-secondary` light-gray background. Every image uses white label text over a fixed 60% black translucent `64px` masked scrim with `16px` backdrop blur.
- Image and asset fidelity: the first five existing Matcha category scene assets are reused as approximately `211 x 211px` square images, vertically centered behind the approximately `211 x 158px` visible frame; no placeholders or generated substitutes were introduced.
- Copy and content: the localized category labels remain sourced from the existing Topic fixture.

## Interaction and runtime evidence

- The full tile remains the link target.
- The five-item row has zero horizontal overflow, so edge navigation controls are absent.
- Keyboard focus renders a `2px` solid semantic outline with a `4px` offset.
- Focused Storybook interaction tests passed: `13/13` across the Shortcut Rail and Topic page stories, including the five-, six-, seven-, and Mobile seven-item boundaries.
- Browser console errors and warnings: none.

## Comparison history

- Pass 1 used five equal tracks with `256px` imagery; user feedback identified the module as too large.
- Pass 2 moved to six-column sizing at approximately `211px`; user requested one more reduction.
- Pass 3 uses seven-column sizing at approximately `178px` with `18px / 24px` labels. The normalized comparison now closely matches the source card scale while preserving the requested below-image labels.
- Pass 4 changes only the category-label typography to `16px / 20px` at weight `400`, following the final annotation; card geometry and spacing remain unchanged.
- Pass 5 restores the titled Shortcut Rail's existing light-gray surface for the image-card presentation; card and label geometry remain unchanged.
- Pass 6 changes the PC grid to six equal columns and lowers the image height to a `4:3` ratio. At the verified viewport each tile renders at approximately `211 x 158px`; gray surface and `16px / 20px / 400` labels remain unchanged.
- Pass 7 explicitly centers each covered image within its `4:3` frame using `object-position: 50% 50%`; frame geometry and surrounding layout remain unchanged.
- Pass 8 fixes the crop implementation itself: the inner image previously remained approximately `211 x 211px` and was clipped from the top; it now absolutely fills the approximately `211 x 158px` frame, so `object-fit: cover` and `object-position: 50% 50%` produce a true centered crop.
- Pass 9 follows the clarified geometry: the inner image is restored to approximately `211 x 211px` (`1:1`) while its vertical center is aligned to the approximately `211 x 158px` frame center, producing equal top and bottom clipping.
- Pass 10 removes the image-card label's fixed two-line height. Current one-line labels render at `20px` high, while the shared clamp still allows longer labels to grow naturally to two lines.
- Pass 11 moves the desktop image-card labels onto the lower image edge and reuses the existing `AdaptiveImageScrim` treatment from ThemeProductList. Labels remain adaptive up to two lines; the below-image label stays available only for the compact mobile presentation.
- Pass 12 completes the ThemeProductList behavior rather than only its CSS: every category image now samples its own bottom color, feeds that color into the shared scrim, and switches between dark and light label text through the same `heroBannerPalette` calculation.
- Pass 13 replaces the adaptive color sampling with the final fixed treatment: every label is white and every image uses the shared scrim's default 80% black-to-transparent gradient.
- Pass 14 lowers only the Shortcut Rail image-card scrim from the shared 80% default to 60%; ThemeProductList and other consumers retain 80%.
- Pass 15 reduces the overlaid label's inline and bottom padding from 16px to 8px while retaining the 32px top fade space.
- Pass 16 increases only the PC image-card title-to-card row gap from 16px to 24px using `--space-300`; compact and mobile presentations remain unchanged.
- Pass 17 increases only the Mobile image-card fallback artwork from 56px to 64px using `--space-800`; its 68px item width, below-image label, native scrolling, and hidden paging controls remain unchanged. The standard compact presentation stays at 56px.
- Pass 18 gives PC image-card entries a 160px minimum width while retaining one-sixth fluid sizing above that floor. At the 1024px desktop boundary, five 160px entries and four 16px gaps fit within the 928px content area without overflow or paging controls.
- Pass 19 makes the image-card presentation count-aware on PC only: one to six entries use the large 4:3 treatment, while seven or more fall back to the original compact circular rail. Mobile keeps its current 68px item and 64px image geometry at every item count.
- Pass 20 restores the shared Shortcut Rail horizontal paging behavior when six 160px-minimum cards overflow at the 1024px PC boundary. The full-height 128px edge mask now sits above the label scrim (`z-index: 3` over `2`), so its fade covers the complete card height instead of leaving the dark lower scrim visible. Wide PC, the seven-item compact fallback, and Mobile remain unchanged.
- Pass 21 vertically centers the PC image-card paging control against the complete `4:3` rail height instead of retaining the compact 80px-icon offset. Browser geometry confirms a `0px` center delta; compact PC and Mobile alignment remain unchanged.
- Pass 22 increases only the seven-or-more PC image-card fallback from `80 x 80px` to `96 x 96px` for visual comparison. The standard homepage Shortcut Rail remains `80px`, while Mobile remains `64px`.

## Final result

passed
# Blog related-documents Astryx style QA

## Comparison target

- Source visual truth: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-related-audit/01-astryx-related-reference.png`
- Browser-rendered implementation: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-related-audit/02-yami-related-after.png`
- Responsive implementation evidence: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-related-audit/03-yami-related-mobile.png`
- Combined comparison: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-related-audit/04-related-comparison.png`

## Viewport and normalization

- Source and desktop implementation: `1448 x 1257` CSS px and image pixels, light theme, device density `1`.
- Mobile implementation: `375 x 812` CSS px and image pixels, light theme, device density `1`.
- Both desktop captures place the article-end related section in the same viewport state. No density normalization was required.

## Full-view and focused comparison evidence

- The combined comparison verifies the shared `752px` content track, leading divider, section title, two-column link grid, muted filled link surfaces, compact arrow affordances, and footer transition.
- Runtime measurements verify `372px + 8px + 372px` desktop columns and `48px` link rows. At `375px`, links become one `343px` column with no horizontal overflow.

## Findings

No actionable P0, P1, or P2 differences remain for the requested related-document style.

- Fonts and typography: link titles use YAMI's existing `16px` body tier. The section heading intentionally retains YAMI's `20/28px` article hierarchy rather than copying Astryx's `29/36px` display size.
- Spacing and layout rhythm: the divider, `24px` section gaps, `8px` card gap, two-column desktop grid, single-column mobile grid, and compact link height match the reference structure. YAMI's `12px` surface radius is intentionally retained instead of Astryx's `16px` radius.
- Colors and visual tokens: link backgrounds, text, hover feedback, and divider use existing semantic YAMI tokens.
- Image quality and asset fidelity: this section contains no raster assets. The shipped Hugeicons arrow is used; no custom SVG, text glyph, or CSS drawing was introduced.
- Copy and content: the three existing localized related documents are preserved; only their presentation changed. The separate previous/next Blog navigation was removed at the user's request.

## Interaction and runtime evidence

- The first related-document link navigated to `/zh/docs/getting-started` successfully.
- Blog pagination count: `0`.
- Browser console errors: `0`.
- `pnpm validate`: passed, including lint, content checks, workspace type checks, generated and boundary checks, and all package tests.

## Comparison history

1. Initial YAMI implementation used three full-width editorial rows with descriptions and no directional affordance; a separate next-article card remained below them.
2. Fix applied: changed related documents to compact muted cards with title and arrow, two desktop columns and one mobile column, and removed Blog previous/next navigation.
3. Post-fix desktop and mobile evidence shows the reference structure with YAMI tokens and no remaining P0/P1/P2 issue.

final result: passed

---

# Blog detail Astryx layout QA

## Comparison target

- Source visual truth: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-detail-audit/01-astryx-detail-viewport.png`
- Browser-rendered implementation: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-detail-audit/13-yami-detail-after-desktop.png`
- Responsive implementation evidence: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-detail-audit/14-yami-detail-after-mobile.png`
- Combined comparison: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-detail-audit/15-detail-after-comparison.png`

## Viewport and normalization

- Source and desktop implementation: `1448 x 1257` CSS px and `1448 x 1257` image pixels, light theme, device density `1`.
- Mobile implementation: `375 x 812` CSS px and `375 x 812` image pixels, light theme, device density `1`.
- Both desktop captures use the first Blog article detail state and the same viewport. No density or crop normalization was needed before the side-by-side comparison.

## Full-view and focused comparison evidence

- The combined comparison verifies the shared centered `752px` article track, header-to-cover sequence, metadata divider, `752 x 423px` 16:9 cover geometry, and editorial body flow.
- Runtime focused checks verify an `18/24px` description, `20/28px` article h2 with `32px` top and `12px` bottom margins, and `44 x 44px` heading-link controls. The breadcrumb link also has a `44px` target height.
- At `375px`, the cover is `343 x 192.94px`, the document width remains `375px`, and there is no horizontal overflow.

## Findings

No actionable P0, P1, or P2 differences remain for the requested Blog detail scope.

- Fonts and typography: YAMI's existing `40/48px` article title and `16/28px` Chinese body are intentionally retained. The description now provides a clearer `18/24px` lead, and article h2 headings use the existing `20/28px` tier for a denser editorial rhythm.
- Spacing and layout rhythm: the duplicate category label is removed, the header closes with a semantic divider, the empty cover remains 16:9, and related documents are compact separated link rows rather than stacked filled cards.
- Colors and visual tokens: all surfaces, dividers, text colors, hover states, and radii use existing YAMI semantic tokens.
- Image quality and asset fidelity: the cover intentionally remains empty at the user's request. No generated, substituted, or code-drawn artwork was introduced.
- Copy and content: the Chinese and English introductions now state the reader payoff and the concrete rule-to-verification path while preserving equivalent structure. Publisher identity remains omitted.
- Accessibility: the breadcrumb landmark is localized, the active category is announced once, and breadcrumb and heading-copy interactions meet the `44px` target size.

## Interaction and runtime evidence

- The heading copy-link control was exercised in the in-app browser and remained operable.
- Browser console errors: none; only React DevTools and HMR development informational messages were present.
- `pnpm validate`: passed, including lint, localized content checks, all workspace type checks, generated-file and boundary checks, and all package tests.

## Comparison history

1. Initial evidence showed a duplicated category label, undersized lead text, loose `24/32px` article h2 headings, heavy related-document cards, and 20–32px interactive targets.
2. Fix applied: removed the duplicate category, added the header divider, promoted the lead to `18/24px`, set article h2 headings to `20/28px` with tighter margins, converted related documents to separated editorial rows, expanded targets to `44px`, and rewrote the bilingual opening around reader payoff and evidence flow.
3. Post-fix desktop and mobile evidence shows the source-aligned composition, preserved empty-cover requirement, no overflow, and no remaining P0/P1/P2 issue.

final result: passed

---

# Blog index Astryx layout QA

## Comparison target

- Source visual truth: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-reference/astryx-blog-1448.png`
- Browser-rendered implementation: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-reference/yami-blog-final-1448.png`
- Combined comparison: `/Users/divikwu/.codex/visualizations/2026/09/01/01a05a4b-6c49-7fa1-9562-0928563efcfb/blog-reference/blog-comparison-1448.png`

## Viewport and normalization

- Source and implementation: `1448 x 1257` CSS px and `1448 x 1257` image pixels, light theme, device density `1`.
- Both captures use the Blog index, default `All/全部` filter, and the same browser viewport. No density or crop normalization was needed before the side-by-side comparison.

## Full-view and focused comparison evidence

- The combined comparison verifies the centered `752px` content track, `752 x 423px` featured cover, two `366 x 206px` secondary covers, centered filter row, vertical featured article, and two-column secondary grid.
- A separate focused crop was unnecessary because runtime geometry and the full-size combined image make the selected Tab, type hierarchy, cover radii, and metadata legible.

## Findings

No actionable P0, P1, or P2 differences remain for the requested Blog index scope.

- Fonts and typography: YAMI type tokens remain in use; the featured title is visually stronger than secondary titles, and descriptions and metadata retain the reference hierarchy.
- Spacing and layout rhythm: content width, cover sizes, grid tracks, and primary vertical positions match the source. YAMI's existing `12px` surface radius is intentionally retained.
- Colors and visual tokens: YAMI semantic foreground, background, focus, and active Tab tokens remain unchanged.
- Image quality and asset fidelity: cover areas intentionally remain empty at the user's request. No generated or substitute artwork was added.
- Copy and content: YAMI localized copy is preserved. Publisher avatar and name are intentionally removed; date and reading time remain.
- Responsiveness and accessibility: at `375 x 812`, covers remain `16:9`, the list becomes one column, the Tab retains its native `48px` touch target, and document width remains `375px` with no horizontal overflow.

## Interaction and runtime evidence

- Category Tab filtering and Blog article navigation passed in the focused Playwright suite.
- TypeScript check passed; focused Docsite Blog suite passed `5/5`.
- Browser console errors: none; only development HMR and React DevTools informational messages were present.

## Comparison history

1. Initial layout used a wide horizontal featured card, oversized content track, non-reference cover sizes, category overlays, and publisher identity.
2. First fix established the source layout and exact cover dimensions, removed publisher identity, and kept covers empty. The selected Tab then exposed a P2 compressed active background because the component's outer height had been overridden.
3. Final fix restored the native `48px` Tab trigger and its `36px` rendered active background while reducing the following section gap. Post-fix evidence keeps the featured cover at `y = 264px` and found no remaining P0/P1/P2 issue.

final result: passed
