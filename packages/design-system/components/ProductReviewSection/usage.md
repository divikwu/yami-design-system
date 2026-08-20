# ProductReviewSection

Use `ProductReviewSection` for a PDP's full customer-review area. It combines
the aggregate score, five-to-one-star distribution, review filters, sorting,
review cards, and progressive disclosure in one labelled section.

Provide the authoritative `reviewCount`, `averageRating`, and
`ratingDistribution` independently from the initially supplied review page.
The component fills missing star rows with zero so the summary always keeps a
stable five-row structure.

Filters work locally from `verifiedPurchase` and `photos`; sorting is either
controlled by the caller or driven by an optional comparator on each sort
option. Use `initialVisibleCount` and `viewMoreIncrement` for local progressive
disclosure. Fetching or submitting reviews remains the caller's responsibility.

Do not use this component for a small editorial review rail. Use `ReviewList`
when each review should link to a different product or appear as curated social
proof on a homepage or topic page.

Every action has a native button, chip, select, or link semantic. Rating
distributions expose `role="meter"`, avatars require meaningful alternative
text, and the empty filtered state provides one action to restore all reviews.
