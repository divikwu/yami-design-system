# ThemeHero

A full-width theme storytelling module with selectable copy, one primary CTA
and a campaign image repeated as a blurred atmospheric background.

## When to use

Use it at the top of a themed landing page when the campaign needs a concise
positioning statement and one clear path into its assortment. The copy remains
real DOM text so it can be translated, selected and indexed.

## Content

- Keep the title to roughly two desktop lines.
- Use one or two short paragraphs for `description`.
- Supply intrinsic image dimensions and meaningful foreground alt text.
- Omit `cta` when the module is purely editorial.

## Accessibility

The title is an `h2`; place the component beneath the page's `h1`. The blurred
background image is decorative and hidden from assistive technology. The
foreground image carries `image.alt`, and the CTA uses the shared `Button`
keyboard and focus behavior.

## Responsive behavior

At 1024px and above, content is a centered, 1440px-capped two-column layout
inside the 448px full-bleed band. The desktop container is flush vertically and
uses a 48px inline inset. Below 1024px, copy and artwork stack while retaining
the same readable text and action order.
