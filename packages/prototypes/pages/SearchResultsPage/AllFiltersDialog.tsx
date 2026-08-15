"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
} from "@yami/design-system";

import styles from "./AllFiltersDialog.module.css";
import type {
  SearchResultsCategoryOption,
  SearchResultsCopy,
  SearchResultsLocale,
} from "./SearchResultsPage.types";

const addIcon = new URL(
  "../../../design-system/assets/icons/system/add.svg",
  import.meta.url
).href;
const minusIcon = new URL(
  "../../../design-system/assets/icons/system/minus.svg",
  import.meta.url
).href;
const arrowRightIcon = new URL(
  "../../../design-system/assets/icons/system/arrow-right.svg",
  import.meta.url
).href;
const closeIcon = new URL(
  "../../../design-system/assets/icons/action/close.svg",
  import.meta.url
).href;
const backIcon = new URL(
  "../../../design-system/assets/icons/action/arrow-left.svg",
  import.meta.url
).href;
const tagCloseIcon = new URL(
  "../../../design-system/assets/icons/system/close.svg",
  import.meta.url
).href;
const fulfilledIcon = new URL(
  "../../../design-system/assets/logos/yami-icon-fill.svg",
  import.meta.url
).href;

export type AllFiltersSortValue =
  | "featured"
  | "best-seller"
  | "popularity"
  | "most-reviews"
  | "most-ratings"
  | "newest"
  | "price-high"
  | "price-low";

type ExpandableFilterSection =
  | "sort"
  | "category"
  | "offers"
  | "brand"
  | "region"
  | "price"
  | "tags"
  | "seller";

interface AllFiltersDialogProps {
  open: boolean;
  locale: SearchResultsLocale;
  copy: SearchResultsCopy;
  resultCount: number;
  sort: AllFiltersSortValue;
  category: string;
  fulfilled: boolean;
  menuValues: Record<string, string[]>;
  onClose: () => void;
  onApply: (value: {
    sort: AllFiltersSortValue;
    category: string;
    fulfilled: boolean;
    menuValues: Record<string, string[]>;
  }) => void;
  onClear: () => void;
}

const sortValues: AllFiltersSortValue[] = [
  "featured",
  "best-seller",
  "popularity",
  "most-reviews",
  "most-ratings",
  "newest",
  "price-high",
  "price-low",
];

function findCategoryLabel(
  options: readonly SearchResultsCategoryOption[],
  value: string
): string | undefined {
  for (const option of options) {
    if (option.value === value) return option.label;
    const childLabel = findCategoryLabel(option.children ?? [], value);
    if (childLabel) return childLabel;
  }
  return undefined;
}

function SectionToggle({ expanded }: { expanded: boolean }) {
  return (
    <>
      <img
        className={styles.desktopSectionIcon}
        src={expanded ? minusIcon : addIcon}
        alt=""
        width={16}
        height={16}
      />
      <img
        className={styles.mobileSectionIcon}
        src={arrowRightIcon}
        alt=""
        width={16}
        height={16}
      />
    </>
  );
}

function CategoryTree({
  options,
  expanded,
  value,
  depth = 0,
  onExpand,
  onValueChange,
}: {
  options: readonly SearchResultsCategoryOption[];
  expanded: ReadonlySet<string>;
  value: string;
  depth?: number;
  onExpand: (value: string) => void;
  onValueChange: (value: string) => void;
}) {
  return options.map((option) => {
    const hasChildren = Boolean(option.children?.length);
    const isExpanded = expanded.has(option.value);
    return (
      <div key={option.value} className={styles.categoryBranch}>
        <div
          className={styles.categoryRow}
          style={{ "--category-depth": depth } as React.CSSProperties}
        >
          <label className={styles.categoryChoice}>
            <RadioGroupItem value={option.value} />
            <span>{option.label}</span>
          </label>
          {hasChildren && (
            <button
              className={styles.expandButton}
              type="button"
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${
                option.label
              }`}
              aria-expanded={isExpanded}
              onClick={() => onExpand(option.value)}
            >
              <SectionToggle expanded={isExpanded} />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <CategoryTree
            options={option.children ?? []}
            expanded={expanded}
            value={value}
            depth={depth + 1}
            onExpand={onExpand}
            onValueChange={onValueChange}
          />
        )}
      </div>
    );
  });
}

export function AllFiltersDialog({
  open,
  locale,
  copy,
  resultCount,
  sort,
  category,
  fulfilled,
  menuValues,
  onClose,
  onApply,
  onClear,
}: AllFiltersDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [draftSort, setDraftSort] = useState(sort);
  const [draftCategory, setDraftCategory] = useState(category);
  const [draftFulfilled, setDraftFulfilled] = useState(fulfilled);
  const [draftMenuValues, setDraftMenuValues] = useState(menuValues);
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [mobileSection, setMobileSection] = useState<
    ExpandableFilterSection | null
  >(null);

  const labels = useMemo(() => {
    const [
      categoryLabel,
      offersLabel,
      inStockLabel,
      brandLabel,
      regionLabel,
      priceLabel,
      tagsLabel,
      sellerLabel,
    ] = copy.filterMenus;
    return {
      category: categoryLabel ?? "Category",
      offers: offersLabel ?? "Offers",
      inStock: inStockLabel ?? "In Stock",
      brand: brandLabel ?? "Brand",
      region: regionLabel ?? "Region",
      price: priceLabel ?? "Price",
      tags: tagsLabel ?? "Tags",
      seller: sellerLabel ?? "Seller",
    };
  }, [copy.filterMenus]);

  const sortOptions = useMemo(
    () => [
      copy.sortFeatured,
      copy.sortBestSeller,
      copy.sortPopularity,
      copy.sortMostReviews,
      copy.sortMostRatings,
      copy.sortNewest,
      copy.sortPriceHigh,
      copy.sortPriceLow,
    ],
    [copy]
  );

  useEffect(() => {
    if (!open) return;
    setDraftSort(sort);
    setDraftCategory(category);
    setDraftFulfilled(fulfilled);
    setDraftMenuValues(menuValues);
    setMinimumPrice("");
    setMaximumPrice("");
    setExpanded(new Set());
    setExpandedCategories(new Set());
    setMobileSection(null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [category, fulfilled, menuValues, onClose, open, sort]);

  if (!open) return null;

  function toggleSection(section: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function toggleMultiple(label: string, option: string, checked: boolean) {
    setDraftMenuValues((current) => {
      const values = current[label] ?? [];
      return {
        ...current,
        [label]: checked
          ? [...values, option]
          : values.filter((value) => value !== option),
      };
    });
  }

  const selectedTags = [
    ...(sort !== draftSort
      ? [
          {
            key: "sort",
            label: sortOptions[sortValues.indexOf(draftSort)] ?? draftSort,
            onRemove: () => setDraftSort(sort),
          },
        ]
      : []),
    ...(draftCategory
      ? [
          {
            key: "category",
            label:
              findCategoryLabel(copy.categoryOptions, draftCategory) ??
              draftCategory,
            onRemove: () => setDraftCategory(""),
          },
        ]
      : []),
    ...Object.entries(draftMenuValues).flatMap(([label, values]) =>
      values.map((option) => ({
        key: `${label}-${option}`,
        label: option,
        onRemove: () => toggleMultiple(label, option, false),
      }))
    ),
  ];

  function getSectionLabel(section: ExpandableFilterSection) {
    if (section === "sort") return copy.sortLabel;
    return labels[section];
  }

  function renderMultipleOptions(label: string) {
    return (
      <div className={styles.optionGrid} role="group" aria-label={label}>
        {(copy.filterMenuOptions[label] ?? []).map((option) => {
          const checked = draftMenuValues[label]?.includes(option) ?? false;
          return (
            <label className={styles.optionRow} key={option}>
              <Checkbox
                checked={checked}
                onCheckedChange={(nextChecked) =>
                  toggleMultiple(label, option, Boolean(nextChecked))
                }
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  function renderSectionContent(section: ExpandableFilterSection) {
    if (section === "sort") {
      return (
        <RadioGroup
          className={styles.optionGrid}
          value={draftSort}
          onValueChange={(value) =>
            setDraftSort(value as AllFiltersSortValue)
          }
          aria-label={copy.sortLabel}
        >
          {sortOptions.map((option, index) => (
            <label className={styles.optionRow} key={sortValues[index]}>
              <RadioGroupItem value={sortValues[index]} />
              <span>{option}</span>
            </label>
          ))}
        </RadioGroup>
      );
    }

    if (section === "category") {
      return (
        <RadioGroup
          className={styles.categoryList}
          value={draftCategory}
          onValueChange={(value) => {
            const nextValue = String(value);
            setDraftCategory(nextValue);
            const optionStack = [...copy.categoryOptions];
            while (optionStack.length) {
              const option = optionStack.shift();
              if (!option) break;
              if (option.value === nextValue && option.children?.length) {
                setExpandedCategories((current) =>
                  new Set(current).add(nextValue)
                );
                break;
              }
              optionStack.push(...(option.children ?? []));
            }
          }}
          aria-label={labels.category}
        >
          <CategoryTree
            options={copy.categoryOptions}
            expanded={expandedCategories}
            value={draftCategory}
            onExpand={(value) =>
              setExpandedCategories((current) => {
                const next = new Set(current);
                if (next.has(value)) next.delete(value);
                else next.add(value);
                return next;
              })
            }
            onValueChange={setDraftCategory}
          />
        </RadioGroup>
      );
    }

    if (section === "price") {
      return (
        <div className={styles.priceFields}>
          <input
            inputMode="decimal"
            aria-label={locale === "zh" ? "最低价格" : "Minimum price"}
            placeholder="0"
            value={minimumPrice}
            onChange={(event) => setMinimumPrice(event.target.value)}
          />
          <span>{locale === "zh" ? "至" : "to"}</span>
          <input
            inputMode="decimal"
            aria-label={locale === "zh" ? "最高价格" : "Maximum price"}
            placeholder="0"
            value={maximumPrice}
            onChange={(event) => setMaximumPrice(event.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              if (!minimumPrice && !maximumPrice) return;
              setDraftMenuValues((current) => ({
                ...current,
                [labels.price]: [
                  `${minimumPrice || "0"} ${
                    locale === "zh" ? "至" : "to"
                  } ${maximumPrice || "∞"}`,
                ],
              }));
            }}
          >
            {locale === "zh" ? "应用" : "Apply"}
          </button>
        </div>
      );
    }

    return renderMultipleOptions(getSectionLabel(section));
  }

  function renderSection(
    section: ExpandableFilterSection,
    summary: string | undefined
  ) {
    const label = getSectionLabel(section);
    const isExpanded = expanded.has(section);
    return (
      <section className={styles.section} key={label}>
        <button
          className={styles.sectionHeader}
          type="button"
          aria-expanded={isExpanded}
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.matchMedia("(max-width: 1023.98px)").matches
            ) {
              setMobileSection(section);
              return;
            }
            toggleSection(section);
          }}
        >
          <strong>{label}</strong>
          {!isExpanded && summary && (
            <span className={styles.summary}>{summary}</span>
          )}
          <span className={styles.sectionIcon} aria-hidden="true">
            <SectionToggle expanded={isExpanded} />
          </span>
        </button>
        {isExpanded && (
          <div className={styles.sectionContent}>
            {renderSectionContent(section)}
          </div>
        )}
      </section>
    );
  }

  return (
    <div
      className={styles.overlay}
      data-slot="all-filters-overlay"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-filters-title"
        tabIndex={-1}
        data-slot="all-filters-dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header
          className={`${styles.header} ${
            mobileSection ? styles.subdialogHeader : ""
          }`}
        >
          {mobileSection && (
            <button
              className={styles.backButton}
              type="button"
              aria-label={
                locale === "zh" ? "返回全部筛选" : "Back to all filters"
              }
              onClick={() => setMobileSection(null)}
            >
              <img src={backIcon} alt="" width={24} height={24} />
            </button>
          )}
          {!mobileSection && (
            <button
              className={styles.closeButton}
              type="button"
              aria-label={locale === "zh" ? "关闭筛选" : "Close filters"}
              onClick={onClose}
            >
              <img src={closeIcon} alt="" width={24} height={24} />
            </button>
          )}
          <h2 id="all-filters-title">
            {mobileSection
              ? getSectionLabel(mobileSection)
              : copy.filtersButton}
          </h2>
        </header>

        <div className={styles.body}>
          {mobileSection ? (
            <div
              className={styles.mobileSectionContent}
              data-slot="all-filters-subdialog"
              data-section={mobileSection}
            >
              {renderSectionContent(mobileSection)}
            </div>
          ) : (
            <>
              {renderSection(
                "sort",
                sortOptions[sortValues.indexOf(draftSort)]
              )}

              {renderSection(
                "category",
                findCategoryLabel(copy.categoryOptions, draftCategory)
              )}

              <section className={styles.section}>
                <button
                  className={styles.switchRow}
                  type="button"
                  role="switch"
                  aria-checked={draftFulfilled}
                  onClick={() => setDraftFulfilled((current) => !current)}
                >
                  <strong className={styles.fulfilledLabel}>
                    <img src={fulfilledIcon} alt="" width={24} height={24} />
                    {copy.fulfilledByYami}
                  </strong>
                  <span className={styles.switch} aria-hidden="true">
                    <span />
                  </span>
                </button>
              </section>

              <section className={styles.section}>
                <button
                  className={styles.switchRow}
                  type="button"
                  role="switch"
                  aria-checked={
                    draftMenuValues[labels.inStock]?.includes("in-stock") ??
                    false
                  }
                  onClick={() =>
                    setDraftMenuValues((current) => ({
                      ...current,
                      [labels.inStock]: current[labels.inStock]?.includes(
                        "in-stock"
                      )
                        ? []
                        : ["in-stock"],
                    }))
                  }
                >
                  <strong>{labels.inStock}</strong>
                  <span className={styles.switch} aria-hidden="true">
                    <span />
                  </span>
                </button>
              </section>

              {(
                ["offers", "brand", "region"] as const
              ).map((section) =>
                renderSection(
                  section,
                  draftMenuValues[getSectionLabel(section)]?.join(", ")
                )
              )}

              {renderSection(
                "price",
                draftMenuValues[labels.price]?.join(", ")
              )}

              {(["tags", "seller"] as const).map((section) =>
                renderSection(
                  section,
                  draftMenuValues[getSectionLabel(section)]?.join(", ")
                )
              )}
            </>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div
            className={styles.selectedTags}
            aria-label={locale === "zh" ? "已选筛选" : "Selected filters"}
          >
            {selectedTags.map((tag) => (
              <span className={styles.selectedTag} key={tag.key}>
                <span>{tag.label}</span>
                <button
                  className={styles.removeTagButton}
                  type="button"
                  aria-label={
                    locale === "zh"
                      ? `移除${tag.label}筛选`
                      : `Remove ${tag.label} filter`
                  }
                  onClick={tag.onRemove}
                >
                  <img src={tagCloseIcon} alt="" width={16} height={16} />
                </button>
              </span>
            ))}
          </div>
        )}

        <footer className={styles.footer}>
          <button
            className={styles.clearButton}
            type="button"
            onClick={() => {
              setDraftSort("featured");
              setDraftCategory("");
              setDraftFulfilled(false);
              setDraftMenuValues({});
              setMinimumPrice("");
              setMaximumPrice("");
              onClear();
            }}
          >
            {copy.clearFilters}
          </button>
          <Button
            className={styles.applyButton}
            variant="primary"
            size="md"
            onClick={() =>
              onApply({
                sort: draftSort,
                category: draftCategory,
                fulfilled: draftFulfilled,
                menuValues: draftMenuValues,
              })
            }
          >
            {copy.showResults(resultCount)}
          </Button>
        </footer>
      </div>
    </div>
  );
}
