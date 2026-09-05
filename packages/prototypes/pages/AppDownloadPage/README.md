# App Download Page

Reference: https://yami-app-download.vercel.app/short (captured 2026-09-05).

This page preserves the reference campaign content, section order, 75 products across four categories, tutorial video, Korean/English copy, and both savings-calculator modes. Product imagery, video, and store badges are bundled locally. Prices are captured fixtures, not a live commerce feed; product and download links open the original destinations.

It uses the current design-system Button, Badge, Card, Checkbox, Divider, HorizontalScrollList, ProductCard, and Tabs, with semantic tokens and the shared Yami logo/font. Typography, card geometry, control styling, and campaign colors intentionally follow the design system rather than copying the source's custom controls.

Preview: http://localhost:6006/iframe.html?id=yami-pages-app-download--korean&viewMode=story

PC content sections use 32px block padding and 48px inline gutters below the configurable content cap. `contentMaxWidth` accepts a number (px) or CSS length and defaults to 1920, matching EcommerceHome. Header height and narrow coupon/calculator widths remain independent of the outer content cap. Mobile retains its own spacing. The fixed download CTA is hidden while the tutorial, calculator, or bottom download section is visible and after reaching the footer.

Stories: Korean, English, Mobile, Interactions, SectionNavigation, ContentWidth under `YAMI/Pages/App Download`.

Validation: `pnpm validate`; `pnpm --filter @yami/storybook exec vitest run --project storybook AppDownloadPage`.
