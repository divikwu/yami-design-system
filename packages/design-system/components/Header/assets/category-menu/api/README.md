# V1 category menu images

Exact default (`image`) and selected/hover (`active_image`) assets from the
official Yami category API. Original PNG/GIF bytes and animation are preserved.
English and Chinese snapshots may use different artwork; shared URLs are
downloaded once. These assets do not replace the neighboring Figma references.

Source endpoint, capture time and original URLs are recorded in
`../../../category-menu.en.json` and `../../../category-menu.zh.json`.
`../../../category-menu.images.ts` maps each source URL to its bundled asset.

Refresh from the repository root:

```sh
node tooling/storybook/refresh-category-menu-fixture.mjs
```
