# ProductReviewSection

Use `ProductReviewSection` for a PDP's full customer-review area. It combines
the aggregate score, five-to-one-star distribution, review filters, sorting,
review cards, and progressive disclosure in one labelled section.

Provide the authoritative `reviewCount`, `averageRating`, and
`ratingDistribution` independently from the initially supplied review page.
The component fills missing star rows with zero so the summary always keeps a
stable five-row structure.

The summary collects every photo from the supplied `reviews`, including reviews
outside the active filter or visible page. Photos retain review and photo order
in a horizontally scrollable strip on desktop and mobile. No photo area renders
when the supplied reviews have no photos. Set `copy.reviewPhotos` for the strip
heading; it falls back to `copy.photos`. Reviews not yet supplied by the caller
cannot contribute photos; this component does not fetch additional review pages.

Below 1024px, the title uses the shared `SectionHeading` styling, matching
`ProductList` at 20px with normal weight and a 28px line height by default.
Set `mobileTitleSize={16}` for a 16px title with a 20px line height and Chinese
weight 600 / English weight 500. Language follows the inherited `lang` attribute;
mark mixed-language title spans with their own `lang`. Desktop typography is
unchanged. The summary has a
24px score beside 16px stars, review count underneath, and a 32px write-review
button retaining its shared 44px hit target. The photo strip follows without a
visible heading, using 80px square images and 8px gaps; its accessible label
remains available. Desktop keeps the titled 96px photo strip.
The mobile score row has 4px horizontal padding; the reference notice has 8px
vertical and 12px horizontal padding. Review cards use 12px padding on all sides
below 1024px and retain 16px padding on desktop. The full-width view-all action uses the
shared Button `full` form and `md` size (40px high, 8px radius, 44px hit target).
Desktop retains the content-width, underlined view-all action.
Summary photos use the same desktop hover zoom and reduced-motion behavior as
review-card photos, while their frame sizes and strip spacing stay unchanged.

Filters work locally from `verifiedPurchase` and `photos`; sorting is either
controlled by the caller or driven by an optional comparator on each sort
option. Use `initialVisibleCount` and `viewMoreIncrement` for local progressive
disclosure. Fetching or submitting reviews remains the caller's responsibility.

Do not use this component for a small editorial review rail. Use `ReviewList`
when each review should link to a different product or appear as curated social
proof on a homepage or topic page.

Review-card names and verified-purchase labels have an 8px gap. Verified labels
stay at 12px: use `caption-md` below 1440px and `caption-sm` from 1440px, without
changing the existing caption line-height or success color.

Review-card text and photos share one horizontal content container on desktop
and mobile. Text fills the available space, with 120px square photos on desktop
and 72px on mobile to its right, separated by an 8px gap. Desktop mouse hover
zooms the image inside its fixed frame without moving surrounding content;
reduced-motion preferences disable this effect. Multiple photos scroll
horizontally within that right column; reviews without photos keep the full
text width.

Desktop review rows size to their tallest card's content, with cards stretching
to match others in the same row. Short text-only rows can be shorter than rows
with photos; no fixed desktop minimum height is imposed. Mobile keeps its
existing 200px horizontal card rail.

Every action has a native button, chip, select, or link semantic. Rating
distributions expose `role="meter"`, avatars require meaningful alternative
text, and the empty filtered state provides one action to restore all reviews.
