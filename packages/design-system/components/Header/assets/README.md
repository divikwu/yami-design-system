# Header assets

Storybook fixture artwork for the PC header. Not part of the component's
runtime contract — `HeaderCategory.image` takes any `<img>` source, so consuming
apps pass their own CDN URLs.

## Locale flag — not here

The locale control's flag is **not** a fixture. It comes from the maintained DS
icon set at [`../../../assets/icons/area/`](../../../assets/icons/area/)
(`united-states.svg`, `canada.svg`, `china.svg`, `japan.svg`, `korea.svg`),
which the Storybook **Assets → Icons** story documents. Point `locale.flag` at
one of those rather than adding a flag here.

## Category artwork — 26 PNGs

Mirrored from the production PC header on www.yami.com, where they are served
from `cdn.yamibuy.net` at `48x48` and rendered at 24px. Filenames match the
`ARTWORK` map keys in `../Header.stories.tsx`.

The EN and CN storefronts are **separate CMS feeds**, not translations. Three
files carry a `-zh` / CN-only name because those categories ship different
artwork or have no EN counterpart:

| File | Category | CDN path |
| --- | --- | --- |
| `summer-picks-zh.png` | 凉夏好物 — differs from EN Summer Picks | `itemdescription/cbea8924…` |
| `personal-care-zh.png` | 个护 — differs from EN Personal Care | `itemdescription/a8719878…` |
| `influencer-picks.png` | 网红好味 — CN only | `mkt/4ad12ba6…` |

The remaining files below are shared by both locales.

There is no `categories.png`: the leading "Categories" entry is a menu
affordance, not a merchandising tile, and renders the component's built-in grid
glyph. Production does the same (an `icon-grid` iconfont glyph).

| File | Category | CDN path |
| --- | --- | --- |
| `summer-picks.png` | Summer Picks | `itemdescription/3c31ad37…` |
| `snack.png` | Snack | `item/26f98960…` |
| `grocery.png` | Grocery | `item/4b0932ed…` |
| `beverage.png` | Beverage | `item/afca0a4d…` |
| `beauty.png` | Beauty | `itemdescription/949813a4…` |
| `personal-care.png` | Personal Care | `itemdescription/ef92c9fe…` |
| `home.png` | Home | `item/234b239b…` |
| `electronics.png` | Electronics | `item/f54bfc7c…` |
| `baby-and-mom.png` | Baby & Mom | `item/d7c44f84…` |
| `health.png` | Health | `item/16dcd22e…` |
| `clothing.png` | Clothing | `item/067aad33…` |
| `gifts.png` | Gifts | `itemdescription/824f2686…` |
| `k-trend.png` | K-Trend | `itemdescription/d7f0fd20…` |
| `greater-china.png` | Greater China Region — opens the regional group | `mkpl/d3cfb02a…` |
| `japan.png` | Japan | `mkpl/57ed813d…` |
| `korea.png` | Korea | `mkpl/5a81e5c8…` |
| `southeast-asia.png` | Southeast Asia | `mkt/5076b933…` |
| `best-sellers.png` | Best Sellers | `mkpl/cc46f48f…` |
| `new-arrivals.png` | New Arrivals | `mkpl/2b57d4d6…` |
| `brands.png` | Brands | `mkpl/c350b8be…` |
| `sale.png` | Sale | `mkpl/7f1faf66…` |
| `subscribe.png` | Subscribe | `mkpl/6a785f18…` |
| `gift-card.png` | Gift Card | `mkpl/3aa282aa…` |

### Refreshing

The rail is CMS-driven, so this list drifts as merchandising changes. To
refresh, re-read the live header's `viewBottom_swiperListItem` entries and
overwrite the files in place — the `ARTWORK` map resolves each by name, so no
code change is needed unless a category is added or removed.

Do **not** substitute `../../../assets/icons/category/*.svg`. Those are the
line-art system icons; the rail is specified to carry full-color merchandising
artwork.
