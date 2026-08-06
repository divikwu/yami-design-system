# Signature UI Copy Patterns

Reusable copy templates across the YAMI product. Each pattern has rationale + canonical examples. When adding new UI, match the closest pattern.

## Navigation labels

**Pattern**: short nouns, bilingual paired.

| Context | EN | CN | Combined form |
|---|---|---|---|
| Bottom tab (mobile) | Home | 首页 | Two-line stacked: `Home` / `首页` |
| Bottom tab | Category | 分类 | `Category` / `分类` |
| Bottom tab | Cart | 购物车 | `Cart` / `购物车` |
| Bottom tab | Me | 我的 | `Me` / `我的` |
| Top nav (web) | Deals | 优惠 | Inline: `Deals · 优惠` |
| Breadcrumb | Home > Grocery > Rice | 首页 > 食品 > 大米 | Separate localized breadcrumbs |

**Rule**: 1-4 chars each side; match density of neighboring labels.

## Section titles

**Pattern**: lead with an action verb.

| Wrong | Right |
|---|---|
| "Products You Might Like" | "Just for You · 为你推荐" |
| "Category Browsing" | "Shop by Category · 按分类购物" |
| "Current Promotions" | "Today's Deals · 今日特惠" |

## Error states

**Pattern**: "what happened" + "what to do", in one or two short sentences.

```
暂无订单 · No orders yet
Start shopping to see your orders here.
开始购物查看订单。
```

```
商品已下架 · Item no longer available
Try one of these similar items:
尝试以下类似商品：
```

**Never**: "Oops!", "Something went wrong!", "We're sorry..." (see `writing-standards.md` anti-patterns).

## Empty states

**Pattern**: current state + primary action.

```
购物车是空的 · Your cart is empty
[浏览商品 · Start Shopping]  ← primary button
```

```
未找到结果 · No results found
Try a different keyword or browse categories.
尝试其他关键词或浏览分类。
[返回首页 · Back to Home]
```

## Confirmation / success

**Pattern**: result first, next steps (optional).

```
订单已提交 · Order placed
Order #Y20260420-1234
Estimated delivery: Apr 22-24
```

## Badges (1 word or short phrase)

| Badge | When to use |
|---|---|
| `NEW` | Product added in last 30 days |
| `SALE` | Any discount applied |
| `限时 Limited` | Time-bound promotion, show countdown separately |
| `–30%` | Specific percent discount (with minus sign, GT Walsheim) |
| `BESTSELLER` | Top 1% by category |
| `OUT OF STOCK` | Inventory = 0 (ALL CAPS to signal blocking state) |

## Product card pattern

```
[product image]
[brand name] ›
[product title — up to 2 lines]
[$current]   [$original strike]
[★ 4.8]  [(1.2k)]
[+ Add]  ← pill button, black
```

- Brand name: GT Walsheim 500, 11px, `--text-primary`
- Title: PingFang 400, 13px/16px, max 2 lines with ellipsis
- Price: GT Walsheim 500, 16px, `--text-emphasis` (red)
- Strike: 11px, `--text-secondary`, `text-decoration: line-through`
- Rating: `--text-primary` for score, accent yellow for star
- Add button: 24px pill, black bg, GT Walsheim 500 white text

## Checkout flow copy

**Pattern**: spec-led steps, no fluff.

```
1. 购物车 · Cart
2. 配送地址 · Shipping
3. 付款方式 · Payment
4. 确认订单 · Review
[Place Order · 提交订单]
```

Never: "Let's get you checked out!", "Almost there!", progress bar with "You're making great time"

## Form field labels

**Pattern**: noun + (optional unit/format).

| Field | Label |
|---|---|
| Phone | `Phone · 电话` |
| ZIP code | `ZIP · 邮编` |
| Delivery instructions | `Delivery Notes · 配送备注` |
| Promo code | `Promo Code · 优惠码` |

**Required marker**: `*` after label, red (`--text-emphasis`).
**Optional**: suffix `(Optional · 选填)` small grey text.

## Copy library mapping

Actual i18n strings live in `../../copy-library/ui/*.i18n.json`:
- `buttons.i18n.json` — all button labels
- `empty-states.i18n.json` — all empty states
- `errors.i18n.json` — all error messages
- `notifications.i18n.json` — toasts and system messages
- `labels.i18n.json` — form field labels and section titles

When writing new UI:
1. Check existing keys in copy-library before inventing new copy
2. Match the pattern in this file
3. Add new key via `get_copy` MCP tool workflow (Phase 5+)
