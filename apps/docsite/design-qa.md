# YAMI Docsite Design QA

Date: 2026-08-30

## Result

PASS for the requested first-phase local implementation. The homepage now follows the Astryx reference structure and interaction rhythm while replacing its visual language with YAMI tokens, fonts, components, copy, and official assets.

## Reference evidence

- Live reference: `https://astryx.atmeta.com/`
- Local Astryx source: `/Users/divikwu/Downloads/astryx-main`
- Desktop reference viewport: 1489 x 1257
- Mobile reference viewport: 390 x 844
- Reference captures: `/tmp/yami-docsite-design-qa/astryx-desktop-top.png`, `/tmp/yami-docsite-design-qa/astryx-mobile-top.png`, `/tmp/yami-docsite-design-qa/astryx-mobile-menu.png`
- Combined comparisons: `/tmp/yami-docsite-design-qa/compare-desktop-top.png`, `/tmp/yami-docsite-design-qa/compare-mobile-top.png`, `/tmp/yami-docsite-design-qa/compare-mobile-menu.png`

## Iterations

### 1. Structure and measurements

- Matched the 48px fixed header, 760px desktop hero, rounded content overlap, centered 1200px content rail, three-column capability grid, editorial Blog composition, large final CTA, and reduced two-row footer.
- Matched the mobile single-column flow, paired hero cards, 48px header, and 320px right-side menu drawer.
- Replaced the earlier generic landing-page composition with the source page's hierarchy and spacing rhythm.

### 2. YAMI substitution

- Used the official localized YAMI lockup and inverse asset already owned by the repository.
- Used `@yami/design-system` Button, Badge, Checkbox, Input, Card, and Sheet implementations for visible UI and interaction.
- Used generated YAMI semantic tokens for surfaces, text, dividers, spacing, radii, and state styling.
- Kept the YAMI font stack and bilingual copy model.
- Intentionally did not copy Astryx product photography, gradients, glass effects, decorative illustration, brand color, or typography.

### 3. Interaction and responsive QA

- Header navigation, locale switch, theme switch, GitHub, Storybook, and primary CTA work.
- Search opens with Cmd/Ctrl+K, accepts Chinese input, groups results, supports keyboard navigation, closes with Escape, and restores focus.
- Theme follows/persists the selected light or dark value without a hydration console error.
- Locale switching preserves the current document slug and hash.
- Blog category filtering, Blog detail navigation, and related-document links work.
- Mobile menu opens as a right drawer, closes, and restores focus to the menu trigger.
- Home, Docs detail, and Blog detail were checked at widths 1440, 768, and 402; all reported `scrollWidth === clientWidth`.

### 4. Header utility controls

- Replaced the mixed text/icon desktop utility row with Hugeicons Search, Language, Moon/Sun, and GitHub glyphs.
- Standardized all four utility controls to YAMI small 32 x 32px visuals with token-locked 20 x 20px icons and a 44px interaction target; all four use a transparent resting background plus the same semantic hover fill and timing. The desktop primary header action also uses YAMI small sizing (32px visible height with a 44px interaction target), while mobile remains 40px high.
- Reduced the visible utility-row width from approximately 334px to 224px without changing navigation order or accessible names.
- Matched Astryx's home navigation surface change with YAMI tokens: the header starts on `--background-secondary`, then changes to `--background-primary` with the default divider when the showcase reaches the header. Docs and Blog remain on the page surface.
- Verified light/dark icon contrast, theme state changes, desktop keyboard names, and the 390px mobile header without horizontal overflow.

### 5. Primary navigation tabs

- Matched Astryx's measured desktop navigation geometry: 32px visible items, 12px inline padding, 4px item gaps, and YAMI's full-pill button radius, while retaining a 44px interaction target.
- Replaced the underline treatment with Astryx's text-led state model: inactive links use secondary text, the current page uses primary text, and hover/press feedback uses YAMI neutral semantic surfaces without layout movement.
- Kept the three destinations as semantic navigation links rather than repurposing the design-system `Tabs` component, because they change routes instead of switching an in-page tab panel.
- Increased the neutral hover contrast for both primary navigation links and the four utility icon buttons so feedback remains visible while the home header sits on `--background-secondary`; press feedback uses the next semantic neutral step.

### 6. Static first hero frame

- Completed the selected static Astryx first-frame composition: localized availability and shipping labels, watch product card, chat composer, headphones reward card, backpack purchase card, avatar row, progress, and the centered five-position frame indicator.
- Re-aligned every floating surface to the reference overlap geometry and restored the three-blob blurred background treatment behind the cards.
- Kept the frame static as requested. The indicator is decorative and hidden from assistive technology; there is no autoplay timer or misleading carousel control.
- Kept YAMI's approved font stack and central brand/content while using the MIT-licensed source Neutral imagery, stored as optimized WebP with its license notice under `public/`.

## Motion and scrolling

- The hero is a single static frame as requested; there is no autoplay or carousel timer.
- Removed global smooth scrolling and avoided scroll listeners, blur filters, large gradients, and continuous transforms.
- The fixed hero uses paint containment, while reduced-motion remains respected for document anchor behavior.

## Visual comparison notes

- Desktop comparison confirms the same header density, hero alignment, CTA row, content overlap, and three-column grid rhythm.
- Mobile comparison confirms the same hero ordering, paired preview cards, full-width CTA treatment, and menu drawer geometry.
- Remaining visible differences are deliberate YAMI substitutions: official YAMI assets, semantic neutral surfaces, YAMI radius values, YAMI copy, and real design-system components.

## Automated verification

- `pnpm check:content`: PASS — 13 paired documents, 3 paired Blog posts, 398 generated tokens.
- `pnpm typecheck`: PASS.
- `pnpm test`: PASS — 4 files, 15 Docsite tests.
- `pnpm build`: PASS — 44 statically generated pages.
- Repository `pnpm validate`: PASS, including lint, content, workspace typechecks, principles/tokens/components sync, generated artifacts, boundaries, and workspace tests.

## Boundary

Standalone Playwright/axe CLI runs were not started because this design task was verified in the user-selected in-app browser. Core desktop and mobile paths were exercised there. Vercel deployment was not performed because publishing was not requested.
