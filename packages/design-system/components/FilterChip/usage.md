# FilterChip

Use `FilterChip` for compact, interactive filters in horizontal toolbars.
Use `filled` for suggested filters and `outlined` for filter controls. Both
selected variants use a white surface and a 1px inset focus-color stroke. The
stroke increases to 2px on hover without changing the outer geometry or content
position.

`FilterChipGroup` owns the 8px horizontal gap and overflow scrolling for a row
of chips. It also reserves 4px above and below its contents for the 2px focus
outline and 2px offset, without changing the surrounding layout height.

Use `FilterChipMenu` when the filter needs an anchored popup. Its 290px popup
matches the Search Results specification:

- `selectionMode="single"` uses `RadioGroup`, commits immediately, then closes.
- `selectionMode="multiple"` uses `Checkbox`, keeps draft selections open, and
  commits only from the 40px `md` primary footer action. Clear resets the draft
  values.

The popup is portalled and collision-aware, so it is not clipped by a
horizontally scrolling `FilterChipGroup`. Provide `popupAriaLabel` when the
visible chip label does not fully describe the choices. Single- and
multiple-select menus share a 14px option label and 8px list inset.

Use `FilterChipCategoryMenu` for the 360px hierarchical category filter. It
uses a single RadioGroup across the tree, 36px option rows, 24px indentation
per expanded level, and a fixed Clear / Apply footer. Expand and collapse
controls do not commit a category; Apply commits the current draft selection.
Selecting a parent row reveals its immediate children. The separate 28px
trailing control only expands or collapses that branch and never changes the
selected category.

Do not use the static `Tag` component for filtering.
