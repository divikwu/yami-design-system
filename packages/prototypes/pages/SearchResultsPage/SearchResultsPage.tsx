"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Button,
  FilterChip,
  FilterChipCategoryMenu,
  FilterChipGroup,
  FilterChipMenu,
  Footer,
  Header,
  ProductList,
} from "@yami/design-system";

import styles from "./SearchResultsPage.module.css";
import { AllFiltersDialog, type AllFiltersSortValue } from "./AllFiltersDialog";
import type { SearchResultsPageProps } from "./SearchResultsPage.types";

const hotIcon = new URL("./assets/hot.svg", import.meta.url).href;
const filterIcon = new URL(
  "../../../design-system/assets/icons/action/filter.svg",
  import.meta.url
).href;
const dropdownIcon = new URL(
  "../../../design-system/assets/icons/system/arrow-down.svg",
  import.meta.url
).href;
const expandIcon = new URL(
  "../../../design-system/assets/icons/system/add.svg",
  import.meta.url
).href;
const collapseIcon = new URL(
  "../../../design-system/assets/icons/system/minus.svg",
  import.meta.url
).href;
const fulfilledIcon = new URL(
  "../../../design-system/assets/logos/yami-icon-fill.svg",
  import.meta.url
).href;
const mobileBackIcon = new URL(
  "../../../design-system/assets/icons/action/arrow-left.svg",
  import.meta.url
).href;
const mobileListIcon = new URL(
  "../../../design-system/assets/icons/action/layout-list.svg",
  import.meta.url
).href;
const mobileCartIcon = new URL(
  "../../../design-system/assets/icons/base/cart.svg",
  import.meta.url
).href;

type SortValue = AllFiltersSortValue;

const popularSkeletonWidths = [52, 84, 148, 66, 112, 108, 72, 76, 92, 58];
const controlSkeletonWidths = [72, 88, 132, 92, 78, 82, 86, 76, 74, 82];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function priceValue(value: ReactNode) {
  if (typeof value !== "string" && typeof value !== "number") return 0;
  return Number.parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
}

function countValue(value: ReactNode) {
  if (typeof value !== "string" && typeof value !== "number") return 0;
  return Number.parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
}

function FilterSkeleton({ widths }: { widths: readonly number[] }) {
  return (
    <div
      className={styles.skeletonList}
      data-slot="search-results-filter-skeleton"
      aria-hidden="true"
    >
      {widths.map((width, index) => (
        <span
          key={`${width}-${index}`}
          className={styles.skeletonChip}
          style={{ "--filter-skeleton-width": `${width}px` } as CSSProperties}
        >
          <span className={styles.skeletonBar} />
        </span>
      ))}
    </div>
  );
}

export function SearchResultsPage({
  locale = "en",
  contentMaxWidth = 1440,
  query,
  resultCount,
  header,
  footer,
  products,
  filters,
  filtersLoading = false,
  copy,
  className,
  ...rest
}: SearchResultsPageProps) {
  const contentMaxWidthValue =
    typeof contentMaxWidth === "number"
      ? `${contentMaxWidth}px`
      : contentMaxWidth;
  const [draftQuery, setDraftQuery] = useState(query);
  const [appliedQuery, setAppliedQuery] = useState(query);
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [menuValues, setMenuValues] = useState<Record<string, string[]>>({});
  const [fulfilled, setFulfilled] = useState(false);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortValue>("featured");
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const visibleProducts = useMemo(() => {
    const selectedFilters = filters.filter((filter) =>
      filterIds.includes(filter.id)
    );
    const filtered = products.filter((product) =>
      selectedFilters.every((filter) => filter.productIds.includes(product.id))
    );

    if (sort === "featured" || sort === "newest") return filtered;
    return [...filtered].sort((a, b) => {
      if (sort === "price-low") {
        return priceValue(a.priceCurrent) - priceValue(b.priceCurrent);
      }
      if (sort === "price-high") {
        return priceValue(b.priceCurrent) - priceValue(a.priceCurrent);
      }
      if (sort === "most-reviews") {
        return countValue(b.ratingCount) - countValue(a.ratingCount);
      }
      if (sort === "most-ratings") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      return countValue(b.soldCount) - countValue(a.soldCount);
    });
  }, [filterIds, filters, products, sort]);

  const visibleResultCount = filterIds.length
    ? visibleProducts.length
    : resultCount ?? visibleProducts.length;
  const countLabel = `${visibleResultCount.toLocaleString(
    locale === "zh" ? "zh-CN" : "en-US"
  )} ${visibleResultCount === 1 ? copy.resultSingular : copy.resultPlural}`;
  const resultSummary =
    locale === "zh"
      ? `${copy.resultsFor}：“${appliedQuery || "—"}” · ${countLabel}`
      : `${countLabel} ${copy.resultsFor}: “${appliedQuery || "—"}”`;

  function toggleFilter(filterId: string) {
    setFilterIds((current) => (current[0] === filterId ? [] : [filterId]));
  }

  function resetSearch() {
    setDraftQuery("");
    setAppliedQuery("");
    setFilterIds([]);
    setMenuValues({});
    setCategory("");
    setFulfilled(false);
    setSort("featured");
    setPage(1);
  }

  function clearAllFilters() {
    setFilterIds([]);
    setMenuValues({});
    setCategory("");
    setFulfilled(false);
    setSort("featured");
    setPage(1);
  }

  function submitMobileSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedQuery(draftQuery.trim());
  }

  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="search-results-page"
      lang={locale === "zh" ? "zh-CN" : "en"}
    >
      <div className={styles.desktopHeader}>
        <Header
          {...header}
          searchValue={draftQuery}
          onSearchValueChange={setDraftQuery}
          onSearchSubmit={(value) => {
            setDraftQuery(value);
            setAppliedQuery(value.trim());
          }}
        />
      </div>

      <header
        className={styles.mobileHeader}
        data-slot="search-results-mobile-header"
      >
        <button
          className={styles.mobileHeaderAction}
          type="button"
          aria-label={locale === "zh" ? "返回" : "Back"}
          onClick={() => window.history.back()}
        >
          <img src={mobileBackIcon} alt="" width={24} height={24} />
        </button>
        <form
          className={styles.mobileSearch}
          role="search"
          onSubmit={submitMobileSearch}
        >
          <input
            type="search"
            value={draftQuery}
            aria-label={header.searchLabel ?? copy.sortLabel}
            placeholder={header.searchPlaceholder}
            onChange={(event) => setDraftQuery(event.currentTarget.value)}
          />
        </form>
        <span className={styles.mobileHeaderAction} aria-hidden="true">
          <img src={mobileListIcon} alt="" width={24} height={24} />
        </span>
        {header.cart.href ? (
          <a
            className={styles.mobileHeaderAction}
            href={header.cart.href}
            aria-label={header.cart.label}
          >
            <img src={mobileCartIcon} alt="" width={24} height={24} />
          </a>
        ) : (
          <span className={styles.mobileHeaderAction} aria-hidden="true">
            <img src={mobileCartIcon} alt="" width={24} height={24} />
          </span>
        )}
      </header>

      <main
        className={styles.main}
        data-slot="search-results-main"
        data-content-max-width={contentMaxWidthValue}
        style={
          {
            "--search-results-content-max-width": contentMaxWidthValue,
          } as CSSProperties
        }
      >
        <div className={styles.toolbar} data-slot="search-results-toolbar">
          <section
            className={styles.intro}
            aria-labelledby="search-results-title"
          >
            <h1 id="search-results-title" className={styles.title}>
              {resultSummary}
            </h1>
          </section>

          <section
            className={styles.popular}
            aria-label={copy.filtersLabel}
            aria-busy={filtersLoading || undefined}
          >
            <span className={styles.controlLabel}>{copy.filtersLabel}</span>
            {filtersLoading ? (
              <FilterSkeleton widths={popularSkeletonWidths} />
            ) : (
              <FilterChipGroup
                className={styles.popularList}
                data-selection-mode="single"
                data-search-results-popular-list="true"
              >
                {filters.map((filter) => {
                  const selected = filterIds.includes(filter.id);
                  return (
                    <FilterChip
                      key={filter.id}
                      data-search-results-popular-filter="true"
                      variant="filled"
                      selected={selected}
                      leftIcon={
                        filter.icon === "hot" ? (
                          <img src={hotIcon} alt="" width={16} height={16} />
                        ) : undefined
                      }
                      onClick={() => toggleFilter(filter.id)}
                    >
                      {filter.label}
                    </FilterChip>
                  );
                })}
              </FilterChipGroup>
            )}
          </section>

          <section
            className={styles.controls}
            data-slot="search-results-controls"
            aria-label={copy.filtersButton}
            aria-busy={filtersLoading || undefined}
          >
            {filtersLoading ? (
              <FilterSkeleton widths={controlSkeletonWidths} />
            ) : (
              <FilterChipGroup
                className={styles.controlList}
                data-search-results-control-list="true"
              >
                <div className={styles.filterControlMask}>
                  <FilterChip
                    className={styles.filterControl}
                    data-search-results-filter-button="true"
                    selected={allFiltersOpen}
                    leftIcon={
                      <img src={filterIcon} alt="" width={16} height={16} />
                    }
                    onClick={() => setAllFiltersOpen(true)}
                  >
                    {copy.filtersButton}
                  </FilterChip>
                </div>

                <FilterChipMenu
                  className={styles.sortControl}
                  label={copy.sortLabel}
                  closeLabel={locale === "en" ? "Close sorting" : "关闭排序"}
                  selectionMode="single"
                  value={sort}
                  onValueChange={(value) => setSort(value as SortValue)}
                  options={[
                    { label: copy.sortFeatured, value: "featured" },
                    { label: copy.sortBestSeller, value: "best-seller" },
                    { label: copy.sortPopularity, value: "popularity" },
                    { label: copy.sortMostReviews, value: "most-reviews" },
                    { label: copy.sortMostRatings, value: "most-ratings" },
                    { label: copy.sortNewest, value: "newest" },
                    { label: copy.sortPriceHigh, value: "price-high" },
                    { label: copy.sortPriceLow, value: "price-low" },
                  ]}
                  rightIcon={
                    <img
                      data-slot="search-results-dropdown-icon"
                      src={dropdownIcon}
                      alt=""
                      width={12}
                      height={12}
                    />
                  }
                />

                <FilterChip
                  className={styles.fulfilledControl}
                  data-search-results-fulfilled-filter="true"
                  selected={fulfilled}
                  leftIcon={
                    <img
                      data-slot="search-results-fulfilled-logo"
                      src={fulfilledIcon}
                      alt=""
                      width={16}
                      height={16}
                    />
                  }
                  onClick={() => setFulfilled((current) => !current)}
                >
                  {copy.fulfilledByYami}
                </FilterChip>

                {copy.filterMenus.map((label) => {
                  if (label === (locale === "en" ? "Category" : "分类")) {
                    return (
                      <FilterChipCategoryMenu
                        key={label}
                        className={styles.menuControl}
                        label={label}
                        closeLabel={
                          locale === "en" ? "Close category" : "关闭分类"
                        }
                        popupAriaLabel={
                          locale === "en" ? "Category filters" : "分类筛选"
                        }
                        value={category}
                        onValueChange={setCategory}
                        options={copy.categoryOptions}
                        clearLabel={copy.clearSelection}
                        applyLabel={copy.showResults(visibleResultCount)}
                        rightIcon={
                          <img
                            data-slot="search-results-dropdown-icon"
                            src={dropdownIcon}
                            alt=""
                            width={12}
                            height={12}
                          />
                        }
                        expandIcon={<img src={expandIcon} alt="" />}
                        collapseIcon={<img src={collapseIcon} alt="" />}
                      />
                    );
                  }

                  if (label === (locale === "en" ? "In Stock" : "有货")) {
                    const selected =
                      menuValues[label]?.includes("in-stock") ?? false;
                    return (
                      <FilterChip
                        key={label}
                        className={styles.menuControl}
                        selected={selected}
                        onClick={() =>
                          setMenuValues((current) => ({
                            ...current,
                            [label]: selected ? [] : ["in-stock"],
                          }))
                        }
                      >
                        {label}
                      </FilterChip>
                    );
                  }

                  const selectedValues = menuValues[label] ?? [];
                  return (
                    <FilterChipMenu
                      key={label}
                      className={styles.menuControl}
                      label={label}
                      closeLabel={
                        locale === "en" ? `Close ${label}` : `关闭${label}`
                      }
                      selectionMode="multiple"
                      value={selectedValues}
                      onValueChange={(value) =>
                        setMenuValues((current) => ({
                          ...current,
                          [label]: value,
                        }))
                      }
                      clearLabel={copy.clearSelection}
                      applyLabel={copy.showResults(visibleResultCount)}
                      options={(copy.filterMenuOptions[label] ?? []).map(
                        (option) => ({
                          label: option,
                          value: option,
                        })
                      )}
                      rightIcon={
                        <img
                          data-slot="search-results-dropdown-icon"
                          src={dropdownIcon}
                          alt=""
                          width={12}
                          height={12}
                        />
                      }
                    />
                  );
                })}

                {filterIds.length > 0 && (
                  <button
                    className={styles.clear}
                    type="button"
                    onClick={() => setFilterIds([])}
                  >
                    {copy.clearFilters}
                  </button>
                )}
              </FilterChipGroup>
            )}
          </section>
        </div>

        {visibleProducts.length > 0 ? (
          <ProductList
            className={styles.results}
            title={copy.productsTitle}
            products={visibleProducts}
            layout="waterfall"
            mobileSurface="plain"
            dividerPosition="none"
            loadingLabel={copy.loading}
            onAddToCart={() => {}}
          />
        ) : (
          <section className={styles.empty} aria-live="polite">
            <span className={styles.emptyIcon} aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <circle cx="14" cy="14" r="8.5" />
                <path d="m20.5 20.5 7 7" />
              </svg>
            </span>
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyDescription}</p>
            <Button variant="secondary" size="lg" onClick={resetSearch}>
              {copy.resetSearch}
            </Button>
          </section>
        )}

        {visibleProducts.length > 0 && (
          <nav
            className={styles.pagination}
            data-slot="search-results-pagination"
            aria-label="Pagination"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                aria-current={page === pageNumber ? "page" : undefined}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <span aria-hidden="true">…</span>
            <button
              type="button"
              aria-current={page === 25 ? "page" : undefined}
              onClick={() => setPage(25)}
            >
              25
            </button>
          </nav>
        )}
      </main>

      <AllFiltersDialog
        open={allFiltersOpen}
        locale={locale}
        copy={copy}
        resultCount={visibleResultCount}
        sort={sort}
        category={category}
        fulfilled={fulfilled}
        menuValues={menuValues}
        onClose={() => setAllFiltersOpen(false)}
        onClear={clearAllFilters}
        onApply={(value) => {
          setSort(value.sort);
          setCategory(value.category);
          setFulfilled(value.fulfilled);
          setMenuValues(value.menuValues);
          setPage(1);
          setAllFiltersOpen(false);
        }}
      />

      {footer && <Footer {...footer} />}
    </div>
  );
}
