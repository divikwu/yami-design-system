# Ecommerce Home host comparison

This diagnostic compares the same `YAMI/Pages/Ecommerce Home / PC` story in
the Design Labs Storybook host and the standalone YAMI Canvas Storybook host.
It is separate from the locked Linux Playwright acceptance baselines.

Capture inputs on 2026-08-06:

- Design Labs host commit: `b9feb1ec338685762e48c88611ac7072bde432a0`
- Frozen YAMI tree in that host: `babc3f8d006789d336cab13d880acd9298d2e8b8`
- Frozen source commit: `e22f1e14ac74d1e024d8dffc47935e8f43e115cf`
- Story globals: `locale=zh`, `theme=light`
- Viewport: `1440 × 1000`, DPR 1, reduced motion

The first comparison exposed a real migration defect: the standalone token
generator emitted DTCG `Medium` as a CSS string and dropped the Chinese font
fallback. The generator now emits `font-weight: 500` and
`'GT Walsheim', 'Noto Sans SC', sans-serif`, matching the source host.

After that fix, the common 1440 × 5738 region has normalized RMSE `0.00840516`;
`0.404044%` of pixels differ by more than 2%. The remaining visible differences
are limited to the Hero artwork-derived sampled surface and the intentionally
changed Footer non-link semantics. Page structure, assets, typography and
section geometry are preserved. The source image is 4px taller at the footer.

Files:

- `dl-source-ecommerce-home-zh-light-1440.png`
- `yami-canvas-ecommerce-home-zh-light-1440.png`
- `ecommerce-home-zh-light-1440-diff.png`

Run `pnpm capture:host-visual` while the two Storybook hosts are available at
ports 6006 and 6007. The locked CI baselines are generated separately through
the manual `Generate visual baselines` workflow and must not be updated on
macOS.
