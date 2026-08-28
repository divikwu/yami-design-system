"use client";

import { type CSSProperties, type MouseEvent, type ReactNode, useLayoutEffect, useRef, useState } from "react";

import {
  Badge,
  Button,
  Card,
  Divider,
  FilterChip,
  FilterChipGroup,
  Footer,
  Header,
  ProductList,
  ProductMediaGallery,
  type ProductMediaGalleryHandle,
  ProductReviewSection,
  Tag,
} from "@yami/design-system";

import styles from "./ProductDetailPage.module.css";
import type { ProductDetailPageProps } from "./ProductDetailPage.types";
import { ProductNutritionSheet } from "./ProductNutritionSheet";
import { ProductDetailSheet } from "./ProductDetailSheet";
import { ProductNutritionTable } from "./ProductNutritionTable";

const heartIcon = new URL(
  "../../../design-system/assets/icons/action/heart.svg",
  import.meta.url
).href;
const shareIcon = new URL(
  "../../../design-system/assets/icons/action/share.svg",
  import.meta.url
).href;
const weiboIcon = new URL(
  "../../../design-system/assets/icons/social-monochrome/weibo.svg",
  import.meta.url
).href;
const facebookIcon = new URL(
  "../../../design-system/assets/icons/social-monochrome/facebook.svg",
  import.meta.url
).href;
const emailIcon = new URL(
  "../../../design-system/assets/icons/social-monochrome/email.svg",
  import.meta.url
).href;
const wechatIcon = new URL(
  "../../../design-system/assets/icons/social-monochrome/wechat.svg",
  import.meta.url
).href;
const addIcon = new URL(
  "../../../design-system/assets/icons/system/add.svg",
  import.meta.url
).href;
const minusIcon = new URL(
  "../../../design-system/assets/icons/system/minus.svg",
  import.meta.url
).href;
const sameDayIcon = new URL(
  "../../../design-system/assets/icons/base/same-day.svg",
  import.meta.url
).href;
const returnsIcon = new URL(
  "../../../design-system/assets/icons/base/returns.svg",
  import.meta.url
).href;
const zipcodeIcon = new URL(
  "../../../design-system/assets/icons/base/zipcode.svg",
  import.meta.url
).href;
const yamiSellerLogo = new URL(
  "../../../design-system/assets/logos/yami-ui-en-pc-fill.svg",
  import.meta.url
).href;
const yamiSellerMobileLogo = new URL(
  "../../../design-system/assets/logos/yami-ui-en-mobile-fill.svg",
  import.meta.url
).href;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const deliveryTimePattern =
  /(\btomorrow\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b|\b\d{1,2}:\d{2} (?:AM|PM)\b|明天|\d{1,2}月\d{1,2}日(?: 星期[一二三四五六日天])?|(?:凌晨|上午|下午|晚上)\s*\d{1,2}:\d{2})/gi;

function DeliveryEstimate({ children }: { children: string }) {
  return (
    <p>
      {children.split(deliveryTimePattern).map((part, index) =>
        index % 2 === 1 ? (
          <span
            className={styles.deliveryTime}
            data-slot="product-detail-delivery-time"
            key={`${part}-${index}`}
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </p>
  );
}

function RatingStar() {
  return (
    <svg
      className={styles.ratingStar}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M8 1l2.16 4.38 4.84.7-3.5 3.42.83 4.81L8 12.04l-4.33 2.27.83-4.81L1 6.09l4.84-.71L8 1z"
        fill="currentColor"
      />
    </svg>
  );
}

function DetailDisclosure({
  id,
  label,
  headingLevel = 2,
  defaultExpanded = false,
  locale = "en",
  className,
  children,
}: {
  id: "highlights" | "specifications" | "nutrition" | "ingredients" | "disclaimer";
  label: string;
  headingLevel?: 2 | 3;
  defaultExpanded?: boolean;
  locale?: "en" | "zh";
  className?: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [mobile, setMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  useLayoutEffect(() => {
    const viewport = window.matchMedia("(max-width: 1023.98px)");
    const update = () => {
      setMobile(viewport.matches);
      if (!viewport.matches) setSheetOpen(false);
    };
    update();
    viewport.addEventListener("change", update);
    return () => viewport.removeEventListener("change", update);
  }, []);
  const mobileHighlights = mobile && id === "highlights";
  const mobileSheet = mobile && id !== "highlights" && id !== "nutrition";
  const contentExpanded = mobileHighlights || expanded;
  const headingId = `product-${id}`;
  const contentId = `${headingId}-content`;
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <div
      className={cx(styles.detailModule, className)}
      data-expanded={mobileSheet ? undefined : contentExpanded}
      data-pdp-detail-module={id}
    >
      <Heading id={headingId}>
        {mobileHighlights ? <span className={styles.detailTitle}>{label}</span> : <button
          className={styles.detailToggle}
          type="button"
          aria-controls={mobileSheet ? (sheetOpen ? `product-${id}-sheet` : undefined) : contentId}
          aria-haspopup={mobileSheet ? "dialog" : undefined}
          aria-expanded={mobileSheet ? undefined : expanded}
          data-slot="product-detail-disclosure-trigger"
          onClick={() => mobileSheet ? setSheetOpen(true) : setExpanded((current) => !current)}
        >
          <span>{label}</span>
          <span
            className={mobileSheet ? styles.nutritionSheetArrow : styles.detailArrow}
            aria-hidden="true"
            data-direction={mobileSheet ? "right" : expanded ? "up" : "down"}
            data-slot="product-detail-disclosure-arrow"
          />
        </button>}
      </Heading>
      {mobileSheet ? sheetOpen && (
        <ProductDetailSheet id={id} title={label} closeLabel={locale === "zh" ? `关闭${label}` : `Close ${label}`} onClose={() => setSheetOpen(false)}>
          {children}
        </ProductDetailSheet>
      ) : <div
        className={styles.detailContent}
        id={contentId}
        data-slot="product-detail-disclosure-content"
        hidden={!contentExpanded}
      >
        {children}
      </div>}
    </div>
  );
}

export function ProductDetailPage({
  contentMaxWidth = 1920,
  header,
  footer,
  breadcrumb,
  images,
  brand,
  brandHref,
  title,
  ranking,
  rating,
  ratingCount,
  soldCount,
  priceCurrent,
  priceOriginal,
  discountLabel,
  optionGroups,
  skus,
  bestBefore,
  highlights,
  specifications,
  nutrition,
  nutritionTranslations,
  ingredients,
  serviceDetailsHref,
  purchaseTags = [],
  region,
  recommendations,
  recentlyViewed,
  reviewSection,
  brandSection,
  copy,
  className,
  ...rest
}: ProductDetailPageProps) {
  const galleryRef = useRef<ProductMediaGalleryHandle>(null);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  function openSourcePreview(event: MouseEvent<HTMLAnchorElement>, sourceHref: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const sourceImage = images.find((image) =>
      (typeof image.src === "string" ? image.src : image.src.src) === sourceHref
    );
    if (sourceImage && galleryRef.current?.openPreview(sourceImage.id)) event.preventDefault();
  }
  const [quantity, setQuantity] = useState(1);
  const [showAllTags, setShowAllTags] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(() =>
    Object.fromEntries(optionGroups.map((group) => [group.id, group.value]))
  );
  const availableSkus = skus?.filter((sku) => sku.available);
  const matchesSelection = (options: Readonly<Record<string, string>>, selection: Record<string, string>) =>
    optionGroups.every((group) => options[group.id] === selection[group.id]);
  const selectionAvailable = availableSkus
    ? availableSkus.some((sku) => matchesSelection(sku.options, selectedOptions))
    : optionGroups.every((group) => group.options.some((option) =>
        option.value === selectedOptions[group.id] && !option.unavailable
      ));

  function selectOption(groupId: string, value: string) {
    setSelectedOptions((current) => {
      const next = { ...current, [groupId]: value };
      if (!availableSkus || availableSkus.some((sku) => matchesSelection(sku.options, next))) return next;
      // Preserve as many other selections as possible; inventory order breaks ties.
      const candidates = availableSkus.filter((sku) => sku.options[groupId] === value);
      const score = (options: Readonly<Record<string, string>>) =>
        optionGroups.filter((group) => options[group.id] === next[group.id]).length;
      const closest = candidates.reduce<(typeof candidates)[number] | undefined>(
        (best, sku) => !best || score(sku.options) > score(best.options) ? sku : best,
        undefined
      );
      return closest ? { ...closest.options } : current;
    });
  }
  const contentMaxWidthValue =
    typeof contentMaxWidth === "number"
      ? `${contentMaxWidth}px`
      : contentMaxWidth;

  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="product-detail-page"
    >
      <Header {...header} />

      <main
        className={styles.main}
        data-slot="product-detail-main"
        data-content-max-width={contentMaxWidthValue}
        style={
          {
            "--product-detail-content-max-width": contentMaxWidthValue,
          } as CSSProperties
        }
      >
        <div className={styles.content} data-slot="product-detail-content">
          <div
            className={styles.utilityRow}
            data-slot="product-detail-utility-row"
          >
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <ol>
                {breadcrumb.map((item, index) => (
                  <li key={`${item.label}-${index}`}>
                    {index > 0 ? <span aria-hidden="true">/</span> : null}
                    {item.href ? (
                      <a href={item.href}>{item.label}</a>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <div
              className={styles.shareActions}
              role="group"
              aria-label={copy.share}
            >
              {[
                ["weibo", copy.shareWeibo, weiboIcon],
                ["facebook", copy.shareFacebook, facebookIcon],
                ["email", copy.shareEmail, emailIcon],
                ["wechat", copy.shareWechat, wechatIcon],
              ].map(([id, label, icon]) => (
                <Button
                  key={id}
                  variant="tertiary"
                  form="icon"
                  size="sm"
                  aria-label={label}
                  data-pdp-share-action={id}
                >
                  <img src={icon} alt="" width={20} height={20} />
                </Button>
              ))}
            </div>
          </div>

          <article className={styles.product} aria-labelledby="product-title">
            <div
              className={styles.productContent}
              data-slot="product-detail-left-content"
            >
              <div
                className={styles.productOverview}
                data-slot="product-detail-overview"
              >
                <ProductMediaGallery
                  ref={galleryRef}
                  className={styles.gallery}
                  images={images}
                  galleryLabel={copy.galleryLabel}
                  thumbnailsLabel={copy.thumbnailsLabel}
                  previousLabel={copy.previousImage}
                  nextLabel={copy.nextImage}
                  desktopPreview
                  mobilePreview
                  openPreviewLabel={copy.openImagePreview}
                  closePreviewLabel={copy.closeImagePreview}
                />

                <div
                  className={styles.productInfoColumn}
                  data-slot="product-detail-info-column"
                >
                  <section
                    className={styles.productInfo}
                    data-slot="product-detail-info"
                  >
                    <div
                      className={styles.productSummary}
                      data-slot="product-detail-summary"
                      data-pdp-info-module="summary"
                    >
                      <div className={styles.brandRow}>
                        {brandHref ? (
                          <a className={styles.brand} href={brandHref}>
                            {brand}
                          </a>
                        ) : (
                          <span className={styles.brand}>{brand}</span>
                        )}
                        <div
                          className={styles.mobileSummaryActions}
                          data-slot="product-detail-mobile-summary-actions"
                        >
                          <Button
                            variant="tertiary"
                            form="icon"
                            size="sm"
                            aria-label={copy.addToFavorites}
                            data-pdp-mobile-action="favorite"
                          >
                            <img src={heartIcon} alt="" width={20} height={20} />
                          </Button>
                          <Button
                            variant="tertiary"
                            form="icon"
                            size="sm"
                            aria-label={copy.share}
                            data-pdp-mobile-action="share"
                          >
                            <img src={shareIcon} alt="" width={20} height={20} />
                          </Button>
                        </div>
                      </div>

                    <h1 id="product-title" className={styles.title}>
                      {title}
                    </h1>

                    {ranking && <div
                      className={styles.rankingRow}
                      data-slot="product-detail-ranking"
                    >
                      <Badge
                        type="best-sellers"
                        size="md"
                      >
                        {ranking}
                      </Badge>
                    </div>}

                    <div
                      className={styles.ratingRow}
                      data-slot="product-detail-rating"
                    >
                      <button
                        className={styles.ratingButton}
                        type="button"
                        aria-label={`${copy.ratingLabel} ${rating} out of 5, ${ratingCount} reviews`}
                      >
                        <RatingStar />
                        <span>{rating.toFixed(1)}</span>
                        <span className={styles.secondaryText}>
                          ({ratingCount})
                        </span>
                      </button>
                      <span className={styles.metaSeparator} aria-hidden="true">
                        ·
                      </span>
                      <span data-slot="product-detail-sales-volume">
                        {soldCount}
                      </span>
                      <span className={styles.metaSeparator} aria-hidden="true">
                        ·
                      </span>
                      <button
                        className={cx(styles.textButton, styles.writeReviewButton)}
                        type="button"
                        data-slot="product-detail-write-review"
                      >
                        <span
                          className={styles.writeReviewIcon}
                          aria-hidden="true"
                          data-slot="product-detail-write-review-icon"
                        />
                        <span>{copy.writeReview}</span>
                      </button>
                    </div>

                    <div
                      className={styles.priceRow}
                      data-slot="product-detail-price"
                    >
                      <strong className={styles.priceCurrent}>
                        {priceCurrent}
                      </strong>
                      <span className={styles.priceOriginal}>
                        {priceOriginal}
                      </span>
                      <span
                        className={styles.discountText}
                        data-slot="product-detail-discount"
                      >
                        {discountLabel}
                      </span>
                    </div>
                    {optionGroups.length === 0 && (
                      <p
                        className={styles.bestBefore}
                        data-slot="product-detail-best-before"
                      >
                        <span>{copy.bestBefore}</span> {bestBefore}
                      </p>
                    )}
                    </div>

                  {optionGroups.length > 0 && <div
                    className={styles.productOptionsModule}
                    data-pdp-info-module="options"
                  >
                    <div
                      className={styles.optionStack}
                      data-slot="product-detail-options"
                    >
                      {optionGroups.map((group) => {
                        const selectedOption = group.options.find(
                          (option) => option.value === selectedOptions[group.id]
                        );

                        return (
                          <fieldset key={group.id} className={styles.optionGroup}>
                          <legend className={styles.optionGroupLegend}>
                            {group.label}
                          </legend>
                          <div
                            className={styles.optionGroupHeading}
                            data-slot="product-detail-option-group-heading"
                            aria-hidden="true"
                          >
                            <span>
                              {group.label}: {selectedOption ? (
                                <strong className={styles.optionGroupSelection}>
                                  {selectedOption.label}
                                </strong>
                              ) : null}
                            </span>
                            <div
                              className={styles.optionGroupArrow}
                              data-slot="product-detail-option-group-arrow"
                            >
                              <span
                                className={styles.optionGroupArrowIcon}
                                aria-hidden="true"
                              />
                            </div>
                          </div>
                          <FilterChipGroup
                            className={styles.optionChips}
                            aria-label={group.label}
                            data-pdp-option-group={group.id}
                          >
                            {group.options.map((option) => {
                              const candidates = availableSkus?.filter((sku) => sku.options[group.id] === option.value);
                              const availability = candidates
                                ? candidates.length === 0 ? "sold-out"
                                  : candidates.some((sku) => matchesSelection(sku.options, { ...selectedOptions, [group.id]: option.value }))
                                    ? "available" : "other-combination"
                                : option.unavailable ? "sold-out" : "available";
                              const hint = availability === "sold-out"
                                ? copy.optionSoldOut ?? "All combinations are out of stock"
                                : availability === "other-combination"
                                  ? copy.optionOtherCombination ?? "Current combination is out of stock; select to switch to an available combination"
                                  : undefined;
                              return (
                              <FilterChip
                                key={option.value}
                                data-availability={availability}
                                data-option-value={option.value}
                                selected={
                                  selectedOptions[group.id] === option.value
                                }
                                disabled={availability === "sold-out"}
                                aria-label={hint ? `${option.label}, ${hint}` : option.label}
                                title={hint}
                                onClick={() => selectOption(group.id, option.value)}
                              >
                                {option.label}
                                {availability === "sold-out" ? (
                                  <svg className={styles.optionUnavailableSlash} viewBox="0 0 40 40" aria-hidden="true">
                                    <line x1="0" y1="40" x2="40" y2="0" />
                                  </svg>
                                ) : null}
                              </FilterChip>
                              );
                            })}
                          </FilterChipGroup>
                          </fieldset>
                        );
                      })}
                    </div>

                    <p
                      className={styles.bestBefore}
                      data-slot="product-detail-best-before"
                    >
                      <span>{copy.bestBefore}</span> {bestBefore}
                    </p>
                    </div>}
                  </section>

                  <section
                    className={styles.details}
                    aria-labelledby="product-highlights"
                    data-slot="product-detail-details"
                  >
                    <DetailDisclosure
                      id="highlights"
                      label={copy.productHighlights}
                      defaultExpanded
                    >
                      <ul className={styles.highlightList}>
                        {highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    </DetailDisclosure>

                    <DetailDisclosure
                      id="specifications"
                      label={copy.specifications}
                      locale={rest.lang?.startsWith("zh") ? "zh" : "en"}
                      defaultExpanded
                    >
                      <dl className={styles.specificationList}>
                        {specifications.map((specification) => (
                          <div key={specification.label}>
                            <dt>{specification.label}</dt>
                            <dd>{specification.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </DetailDisclosure>

                    {nutrition && (
                      <DetailDisclosure id="nutrition" label={nutrition.title} defaultExpanded className={styles.desktopNutrition}>
                        <div className={styles.nutritionContent}>
                          <ProductNutritionTable nutrition={nutrition} />
                          <p className={styles.disclaimer}>{nutrition.note}</p>
                          <a
                            className={styles.detailSource}
                            href={nutrition.sourceHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => openSourcePreview(event, nutrition.sourceHref)}
                          >{nutrition.sourceLabel}</a>
                        </div>
                      </DetailDisclosure>
                    )}

                    {nutrition && (
                      <div className={cx(styles.detailModule, styles.mobileNutrition)}>
                        <h2>
                          <button className={styles.detailToggle} type="button" aria-haspopup="dialog" aria-controls={nutritionOpen ? "product-nutrition-sheet" : undefined} onClick={() => setNutritionOpen(true)}>
                            <span>{nutrition.title}</span>
                            <span className={styles.nutritionSheetArrow} aria-hidden="true" />
                          </button>
                        </h2>
                        {nutritionOpen && (
                          <ProductNutritionSheet
                            nutrition={nutrition}
                            translations={nutritionTranslations}
                            locale={rest.lang?.startsWith("zh") ? "zh" : "en"}
                            onSourceClick={openSourcePreview}
                            onClose={() => setNutritionOpen(false)}
                          />
                        )}
                      </div>
                    )}

                    {ingredients && (
                      <DetailDisclosure id="ingredients" label={ingredients.title} locale={rest.lang?.startsWith("zh") ? "zh" : "en"} defaultExpanded>
                        <div className={styles.ingredientsContent}>
                          <p>{ingredients.body}</p>
                          <p><strong>{ingredients.allergenLabel}</strong> {ingredients.allergens}</p>
                          <a
                            className={styles.detailSource}
                            href={ingredients.sourceHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => openSourcePreview(event, ingredients.sourceHref)}
                          >{ingredients.sourceLabel}</a>
                        </div>
                      </DetailDisclosure>
                    )}

                    <DetailDisclosure
                      id="disclaimer"
                      label={copy.disclaimer}
                      locale={rest.lang?.startsWith("zh") ? "zh" : "en"}
                      headingLevel={3}
                    >
                      <p className={styles.disclaimer}>{copy.disclaimerBody}</p>
                    </DetailDisclosure>
                  </section>
                </div>
              </div>
            </div>

            <aside
              className={styles.purchasePanel}
              aria-label={copy.addToCart}
              data-slot="product-detail-purchase"
            >
              <Card
                className={styles.purchaseCard}
                surface="secondary"
                padding="none"
              >
                <div
                  className={styles.purchaseGroup}
                  data-slot="product-detail-purchase-primary"
                >
                  <div className={styles.purchaseActions}>
                    <Button
                      className={styles.favoriteButton}
                      variant="tertiary"
                      size="sm"
                      rightIcon={
                        <img src={heartIcon} alt="" width={20} height={20} />
                      }
                      data-pdp-purchase-action="favorite"
                    >
                      {copy.addToFavorites}
                    </Button>
                  </div>

                  <div
                    className={styles.purchaseStickyGroup}
                    data-slot="product-detail-purchase-sticky"
                  >
                    <div
                      className={styles.purchaseCheckoutGroup}
                      data-slot="product-detail-purchase-checkout"
                    >
                      <div
                        className={styles.quantityRow}
                        data-slot="product-detail-quantity-row"
                      >
                        <span className={styles.purchaseLabel}>
                          {copy.quantity}
                        </span>
                        <div className={styles.stepper}>
                          <Button
                            className={styles.quantityButton}
                            variant="secondary"
                            form="icon"
                            size="sm"
                            aria-label={copy.decreaseQuantity}
                            disabled={quantity === 1}
                            onClick={() =>
                              setQuantity((value) => Math.max(1, value - 1))
                            }
                          >
                            <span
                              className={styles.stepperIcon}
                              data-slot="product-detail-stepper-icon"
                              aria-hidden="true"
                              style={{
                                ["--product-detail-stepper-icon" as string]: `url("${minusIcon}")`,
                              }}
                            />
                          </Button>
                          <output aria-live="polite">{quantity}</output>
                          <Button
                            className={styles.quantityButton}
                            variant="secondary"
                            form="icon"
                            size="sm"
                            aria-label={copy.increaseQuantity}
                            onClick={() => setQuantity((value) => value + 1)}
                          >
                            <span
                              className={styles.stepperIcon}
                              data-slot="product-detail-stepper-icon"
                              aria-hidden="true"
                              style={{
                                ["--product-detail-stepper-icon" as string]: `url("${addIcon}")`,
                              }}
                            />
                          </Button>
                        </div>
                      </div>

                      <Button
                        variant="emphasis"
                        form="full"
                        size="lg"
                        data-pdp-add-to-cart="true"
                        disabled={!selectionAvailable}
                      >
                        {copy.addToCart}
                      </Button>
                    </div>

                    <div
                      className={`${styles.purchaseGroup} ${styles.purchaseSecondaryGroup}`}
                      data-slot="product-detail-purchase-secondary"
                    >
                      <div
                        className={styles.purchaseFulfillmentGroup}
                        data-slot="product-detail-purchase-fulfillment"
                      >
                      <div
                        className={styles.purchaseSellerShippingSection}
                        data-slot="product-detail-seller-shipping-section"
                      >
                        <div
                          className={styles.sellerBlock}
                          data-slot="product-detail-seller"
                        >
                          <span
                            className={styles.purchaseLabel}
                            data-slot="product-detail-seller-label"
                          >
                            {copy.seller}
                          </span>
                          <div className={styles.sellerIdentity}>
                            <picture className={styles.sellerLogoPicture}>
                              <source
                                media="(max-width: 1023.98px)"
                                srcSet={yamiSellerMobileLogo}
                              />
                              <img
                                className={styles.sellerLogo}
                                src={yamiSellerLogo}
                                alt="YAMI"
                                width={95}
                                height={40}
                                data-slot="product-detail-seller-logo"
                              />
                            </picture>
                          </div>
                        </div>
                        <Divider />
                        <div
                          className={styles.shippingBlock}
                          data-slot="product-detail-shipping"
                        >
                          <div
                            className={styles.shippingDestination}
                            data-slot="product-detail-shipping-destination"
                          >
                            <span className={styles.purchaseLabel}>
                              {copy.shipTo}
                            </span>
                            <span
                              className={styles.shippingLocation}
                              data-slot="product-detail-shipping-location"
                            >
                              Brea 92821
                            </span>
                          </div>
                          <DeliveryEstimate>{copy.deliveryEstimate}</DeliveryEstimate>
                        </div>
                      </div>
                      <Divider className={styles.purchaseFulfillmentDivider} />
                      <div
                        className={styles.purchaseGuaranteeSection}
                        data-slot="product-detail-guarantee-section"
                      >
                        <ul
                          className={styles.guaranteeList}
                          data-slot="product-detail-guarantees"
                        >
                          {copy.serviceGuarantees.map((guarantee, index) => {
                            const icons = [
                              sameDayIcon,
                              zipcodeIcon,
                              returnsIcon,
                            ];
                            const iconNames = [
                              "same-day",
                              "zipcode",
                              "returns",
                            ];
                            return (
                              <li key={guarantee}>
                                <span
                                  className={styles.guaranteeIcon}
                                  data-slot="product-detail-guarantee-icon"
                                  data-icon-name={iconNames[index] ?? "zipcode"}
                                  aria-hidden="true"
                                  style={{
                                    ["--product-detail-guarantee-icon" as string]:
                                      `url("${icons[index] ?? zipcodeIcon}")`,
                                  }}
                                />
                                <span>{guarantee}</span>
                              </li>
                            );
                          })}
                        </ul>
                        {serviceDetailsHref ? (
                          <a
                            className={styles.purchaseDetailsLink}
                            href={serviceDetailsHref}
                            data-slot="product-detail-purchase-details"
                          >
                            {copy.viewDetails}
                          </a>
                        ) : null}
                      </div>
                      </div>
                      {purchaseTags.length > 0 || region ? (
                        <div
                          className={styles.purchaseMetadataGroup}
                          data-slot="product-detail-purchase-metadata"
                        >
                          {purchaseTags.length > 0 ? (
                            <div
                              className={styles.purchaseTagsBlock}
                              data-slot="product-detail-tags-block"
                            >
                              <span
                                className={styles.purchaseLabel}
                                data-slot="product-detail-tags-label"
                              >
                                {copy.tags}
                              </span>
                              <ul
                                id="product-purchase-tags"
                                className={styles.purchaseTags}
                                data-expanded={showAllTags}
                              >
                                {purchaseTags.map((tag) => (
                                  <li key={tag}>
                                    <Tag tone="dark-outline">{tag}</Tag>
                                  </li>
                                ))}
                              </ul>
                              {purchaseTags.length > 3 ? (
                                <button
                                  className={styles.textButton}
                                  data-slot="product-detail-tags-toggle"
                                  type="button"
                                  aria-expanded={showAllTags}
                                  aria-controls="product-purchase-tags"
                                  onClick={() =>
                                    setShowAllTags((isExpanded) => !isExpanded)
                                  }
                                >
                                  {showAllTags
                                    ? copy.showFewerTags
                                    : copy.showAllTags}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          {purchaseTags.length > 0 && region ? (
                            <Divider className={styles.purchaseMetadataDivider} />
                          ) : null}
                          {region ? (
                            <div
                              className={styles.purchaseRegionBlock}
                              data-slot="product-detail-region"
                            >
                              <span
                                className={styles.purchaseLabel}
                                data-slot="product-detail-region-label"
                              >
                                {region.label}
                              </span>
                              <div
                                className={styles.purchaseRegionValue}
                                data-slot="product-detail-region-value"
                              >
                                <img
                                  src={region.iconSrc}
                                  alt=""
                                  width={40}
                                  height={40}
                                  data-slot="product-detail-region-icon"
                                />
                                <span>{region.value}</span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            </aside>
          </article>
        </div>

        <ProductList
          className={styles.recommendations}
          title={copy.recommendations}
          mobileTitleSize={16}
          products={recommendations}
          layout="rail"
          imageLoadingStrategy="windowed"
          onAddToCart={() => {}}
          dividerPosition="top"
          data-pdp-module="recommendations"
        />

        {reviewSection ? (
          <ProductReviewSection
            {...reviewSection}
            mobileTitleSize={16}
            className={styles.reviews}
            data-pdp-module="reviews"
          />
        ) : null}

        {brandSection ? (
          <ProductList
            id="torriden-products"
            className={styles.brandProducts}
            mobileTitleSize={16}
            title={
              <>
                <span lang={brandSection.titleLang}>{brandSection.title}</span>
                {brandSection.logo ? (
                  <img
                    className={styles.brandLogo}
                    src={brandSection.logo.src}
                    alt=""
                    width={brandSection.logo.width}
                    height={brandSection.logo.height}
                    loading="lazy"
                    decoding="async"
                    data-slot="product-detail-brand-logo"
                  />
                ) : null}
              </>
            }
            introContent={
              <div className={styles.brandIntro}>
                <h3>{brandSection.aboutLabel}</h3>
                <p>{brandSection.description}</p>
              </div>
            }
            products={brandSection.products}
            layout="rail"
            imageLoadingStrategy="windowed"
            viewAllHref={brandSection.viewAllHref}
            viewAllLabel={brandSection.viewAllLabel}
            previousLabel={brandSection.previousLabel}
            nextLabel={brandSection.nextLabel}
            onAddToCart={() => {}}
            dividerPosition="top"
            data-pdp-module="brand-products"
          />
        ) : null}

        {recentlyViewed?.length ? (
          <ProductList
            className={styles.recentlyViewed}
            title={copy.recentlyViewed}
            mobileTitleSize={16}
            products={recentlyViewed}
            layout="rail"
            imageLoadingStrategy="windowed"
            onAddToCart={() => {}}
            dividerPosition="top"
            data-pdp-module="recently-viewed"
          />
        ) : null}
      </main>

      {footer ? <Footer {...footer} /> : null}
    </div>
  );
}
