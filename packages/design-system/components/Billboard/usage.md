# Billboard

A full-bleed promotional band whose entire content is one image.

## When to use

A campaign the marketing team ships as finished artwork — the offer, its
styling and its call to action are all drawn into the image. Use it for the
banner directly under the homepage entry points, where the message changes
often and the layout does not.

## When not to use

- **The copy needs to be selectable, translatable or searchable.** Text baked
  into artwork is none of those. Compose `ProductList` with a themed
  appearance, or a card, instead.
- **The band needs interactive parts.** One link covers the whole image; there
  is no second target.

## Accessibility

`label` is required and names the link, because the artwork's words are pixels.
Give `image.alt` an empty string when it would only repeat that label —
otherwise a reader hears the offer twice.

The label lands on the link as well as the band. Naming only the band is not
enough: a link takes its name from its content, and the content here is an
image with empty alt.

Supply `image.mobile` when the desktop artwork's text becomes unreadable at
phone widths; the component swaps below 1024px.

## Layout

Give every artwork its intrinsic `width` and `height`, including
`image.mobile`'s. The band has no content of its own to establish a ratio, so
without them it opens as a strip of padding and jumps to full height when the
image lands. Dimensions that disagree with the artwork are worse than none —
the browser corrects to the natural ratio on load, shifting the page anyway.
