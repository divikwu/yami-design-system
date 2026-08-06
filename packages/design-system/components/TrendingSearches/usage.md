# Trending Searches

The terms shoppers are searching for, each with the results behind it.

## When to use

A homepage or category-page block that turns search demand into browsable
entry points. It answers "what is everyone looking for" and then lets a shopper
act on the answer without typing.

## When not to use

- **The terms have no results to show.** The card is a preview of what the
  search returns; a term with nothing behind it is a link, not a card.
- **The ranking is not meaningful.** Rows are numbered, and a number reads as
  a rank whether or not one was intended. Use `ProductList` for an unranked
  set.

## Two layouts, one set of data

Desktop is a rail of keyword cards, every one open, each previewing the term's
leading two results. The rail changes count on the same widths as
`BrandProductRail` — two cards at 1024, three from 1025, four from 1440.

Mobile is a ranked accordion: one term at a time opens onto a rail that scrolls
the whole result set, plus a CTA into search. It follows `SocialMediaGallery`'s
mobile sequence — the card pads once at 8px, the shared heading sits on that
inner edge, and the result rail bleeds back out to the card's edges so a result
can scroll flush with it.

Taglines hold exactly two lines on desktop — reserved so every card's results
start on the same line, and clamped so long copy clips instead of pushing the
products out. Write for one or two lines; a third is cut. Mobile opens one term
at a time with nothing to align to, so its pill hugs the copy.

Give each keyword three or more products. Desktop previews two and mobile
scrolls the rest — a term with exactly two leaves the mobile rail nothing to
scroll.

## Accessibility

The row toggles exist only below 1024px and the per-card links only above it;
each is `display: none` at the other breakpoint, which also removes it from the
accessibility tree. A reader meets one structure, never both.

`seeAllLabel` is the same words on every card, so the component appends the
term out of sight — otherwise a reader's link list is six identical entries.
Supply `expandLabel` to name the row toggles for the same reason.

`thumbnail.alt` should be empty: the row already carries the term as text, and
the image repeats it.
