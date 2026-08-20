# Icons

Source: `design-guidelines/icons/*.svg` — legacy line-style, 24pt canvas, 1.5px stroke, round joins, `currentColor` fill. Figma brand assets may retain their official colors.

## Available (copied locally, 22 icons)
arrow-down, arrow-left, arrow-right, arrow-up, asterisk, book, cancel, file, folder, grid-view, menu, mobile, moon, paint-board, panel-left, pc, search, sun, tablet, test-tube, web-design, logo-full

## Figma imports

- social → `social/*.svg` (`Social` component set, node `7534:62742`): apple, facebook, google, google-play, instagram, moments, pinterest, redbook, wechat, weibo, youtube
- social-monochrome → `social-monochrome/*.svg` (`Social` component set, node `4600:73430`): email, facebook, instagram, reddit, twitter, wechat, weibo, youtube. Email is a user-supplied asset normalized to the shared 24px `currentColor` contract.
- camera → `action/camera.svg` (`action / camera`, node `6579:12967`) — the mobile header's visual-search entry. Distinct from `action/scan.svg`, which is the barcode glyph.
- layout-grid → `action/layout-grid.svg` (`action / layout-grid`, node `6616:4644`)
- layout-list → `action/layout-list.svg` (`action / layout-list`, node `6616:4643`)
- filter → `action/filter.svg` (`action / fifter`, node `6616:4642`) — filename corrects the source layer's `fifter` typo.
- sort → `action/sort.svg` (`action / sort`, node `6616:4641`)
- account → `base/account.svg` (`tabbar / account`, node `1624:151016`)
- cart → `base/cart.svg` (`tabbar / cart-line`, node `1624:151015`)

## Missing — substitute from Lucide
Required for UI kits but not in source set. Use Lucide CDN as temporary fallback (1.5–2px stroke, close visual match). **Flagged — replace with Figma-exported SVGs when available.**

- heart → `heart`
- bell → `bell`
- star → `star`
- chevron-down → `chevron-down`
- plus / minus → `plus`, `minus`
- location → `map-pin`
- share → `share-2`
- coupon → `ticket`
- home → `home`
- check → `check`
- eye → `eye`

Usage in HTML: `<img src="https://unpkg.com/lucide-static@latest/icons/shopping-cart.svg" width="24" height="24" style="color:var(--text-primary)">`
