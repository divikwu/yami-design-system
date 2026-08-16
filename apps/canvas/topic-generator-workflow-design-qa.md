# Topic Generator workflow design QA

## Comparison target

- Source visual truth: `browser-comment://topic-generator/workflow-execution-reference`
  - User-provided execution-process screenshot showing expandable activity rows, status markers, nested details, and a vertical task narrative.
- Rendered implementation: `/Users/divikwu/diw/workspace/yami-design-system/apps/canvas/topic-generator-workflow-after.jpg`
  - Canvas route: `/topic-generator?content-language=en&selection-strategy=relevance`.

## Viewport and normalization

- Browser viewport: `1706 x 1256` CSS pixels, light theme.
- Implementation capture: `1512 x 1256` pixels at density `1`, excluding the in-app browser chrome.
- Source image is a taller product reference rather than a same-size Topic Generator mock. Comparison normalizes the interaction pattern and information hierarchy, not exact frame dimensions.

## State

- Generic automation workflow, Chinese content, precise-match strategy.
- First stage open by default; remaining stages collapsed.

## Full-view comparison evidence

- The source and implementation were inspected together in the current browser-comment context.
- The implementation preserves the source pattern of a readable execution timeline with disclosure controls, stage icons, status labels, and nested detail content.
- Square separators intentionally replace the source's rounded activity cards per the user's follow-up direction.

## Focused comparison evidence

- The rendered workflow contains eight disclosure rows and sixteen Hugeicons SVGs: one stage icon and one chevron per row.
- Focused browser checks confirmed `20 x 20` stage icons, `12 x 12` chevrons, `0px` row radius, `0px` list gap, and hidden detail content for collapsed rows.
- No additional crop was needed because summary labels, statuses, and expanded Input / Action / Output content are readable in the full capture.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: existing YAMI typography tokens are preserved; body copy uses the 14px body token and compact labels use caption tokens.
- Spacing and layout rhythm: rows form one continuous square-cornered list with full-width horizontal separators and a vertical connector centered behind the stage icons; expanded Input / Action / Output content uses one vertical column at every viewport size.
- Colors and visual tokens: the page and workflow rows use the white primary surface by default; pointer hover applies the neutral gray fill. Black user-input, green automatic, and muted human-confirmation labels retain the existing semantic system.
- Image and icon fidelity: all workflow icons and chevrons use `@hugeicons/react` with the free Stroke Rounded icon set; no placeholder or handwritten icon remains.
- Copy and content: the existing 01–08 workflow responsibilities are unchanged. Expanded content adds only reviewable Input / Action / Output summaries.
- Interaction: all eight rows use native `details/summary`; the first row opens by default, and browser clicking successfully opened another stage without a runtime failure.

## Comparison history

1. Initial implementation used a flat table-like workflow with no progressive disclosure.
2. The first redesign added expandable rows and reviewable Input / Action / Output details.
3. User feedback requested square separation, so card radius and inter-card gaps were removed.
4. User feedback requested Hugeicons, so local mixed SVG assets were replaced with the official free React packages.
5. Post-fix browser evidence confirmed that collapsed detail regions compute to `display: none` and the final list uses Hugeicons throughout.
6. User feedback requested white default rows with gray hover feedback. Browser evidence confirmed the summary and expanded details compute to `rgb(255, 255, 255)`, while the pointer-capable hover rule applies `var(--color-neutral-100)`.
7. User feedback requested vertical Input / Action / Output details. Browser measurements confirmed one `984px` grid column and three full-width blocks with sequential top positions of `367`, `429`, and `507` pixels.
8. User feedback requested a vertical stage connector. Browser evidence confirmed a `1px` line at `34px` from the workflow edge, spanning from `38px` below the top to `38px` above the bottom; stage icons retain an opaque white background above the line.

## Follow-up polish

- P3: when the generator exposes live per-stage events, the same rows can display running duration and retry evidence without changing the current structure.

## Final result

passed
