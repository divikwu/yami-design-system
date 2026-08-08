# ReviewList

`ReviewList` is a customer-review rail with the same section heading anatomy as
`ProductList`. Each rail item is the exported `ReviewCard` child: a rating,
review copy, anonymized reviewer and the related product footer.

## When to use

Use it for a curated set of customer reviews that should sit alongside other
commerce collection sections. Pass the reviews in the order they should appear
and keep the review copy in the caller's locale.

## Responsive behavior

The rail shows three cards at a 1440px content width and four cards at a 1920px
content width, using the same desktop container and gap rhythm as ProductList.
Below the desktop breakpoint it uses the ProductList mobile rail geometry:
fixed 344px cards, page-card side gutters and native horizontal scrolling, with
one card visible on a phone. The mobile surface uses the secondary gray page
background and the shared mobile heading: a localized title plus the circular
view-all action when `viewAllHref` is provided. Without a destination the title
renders without an action. Previous/next paging controls appear on desktop only,
matching ProductList.

## Section divider

The list uses the same desktop section-divider contract as `ProductList`. It
defaults to a 1px gray line above the section. Set `dividerPosition` to `top`,
`bottom`, or `none`; set `dividerVariant` to `gray` or `black`. The black
variant uses the theme-aware 2px emphasis divider. Mobile ignores divider
configuration.

```tsx
<ReviewList
  title="Customer Reviews"
  reviews={reviews}
  dividerPosition="bottom"
  dividerVariant="black"
/>
```

## Accessibility

The section heading labels the review rail. Each rating is exposed as an
accessible five-point image label, reviewer names remain text, and product
images require meaningful alternative text. A product `href` turns the footer
into a native keyboard-reachable link.
