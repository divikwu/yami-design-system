"use client";

import { type CSSProperties, useState } from "react";

import {
  Badge,
  Button,
  Card,
  FilterChip,
  FilterChipGroup,
  Footer,
  Header,
  ProductList,
  ProductMediaGallery,
  ProductReviewSection,
  Tag,
} from "@yami/design-system";

import styles from "./ProductDetailPage.module.css";
import type { ProductDetailPageProps } from "./ProductDetailPage.types";

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
const optionArrowIcon = new URL(
  "../../../design-system/assets/icons/system/arrow-right.svg",
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const deliveryTimePattern =
  /(\btomorrow\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b|\b\d{1,2}:\d{2} (?:AM|PM)\b)/gi;

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
  bestBefore,
  highlights,
  specifications,
  serviceDetailsHref,
  purchaseTags = [],
  recommendations,
  recentlyViewed,
  reviewSection,
  brandSection,
  copy,
  className,
  ...rest
}: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [showAllTags, setShowAllTags] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(() =>
    Object.fromEntries(optionGroups.map((group) => [group.id, group.value]))
  );
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
                  className={styles.gallery}
                  images={images}
                  galleryLabel={copy.galleryLabel}
                  thumbnailsLabel={copy.thumbnailsLabel}
                  previousLabel={copy.previousImage}
                  nextLabel={copy.nextImage}
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

                    <div
                      className={styles.rankingRow}
                      data-slot="product-detail-ranking"
                    >
                      <Badge
                        type="best-sellers"
                        size="md"
                      >
                        {ranking}
                      </Badge>
                    </div>

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
                      <span>{soldCount}</span>
                      <span className={styles.metaSeparator} aria-hidden="true">
                        ·
                      </span>
                      <button className={styles.textButton} type="button">
                        {copy.writeReview}
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
                    </div>

                  <div
                    className={styles.productOptionsModule}
                    data-pdp-info-module="options"
                  >
                    <div
                      className={styles.optionStack}
                      data-slot="product-detail-options"
                    >
                      {optionGroups.map((group) => (
                        <fieldset key={group.id} className={styles.optionGroup}>
                          <legend className={styles.optionGroupLegend}>
                            {group.label}
                          </legend>
                          <div
                            className={styles.optionGroupHeading}
                            data-slot="product-detail-option-group-heading"
                            aria-hidden="true"
                          >
                            <span>{group.label}</span>
                            <div
                              className={styles.optionGroupArrow}
                              data-slot="product-detail-option-group-arrow"
                            >
                              <img
                                src={optionArrowIcon}
                                alt=""
                                width={16}
                                height={16}
                              />
                            </div>
                          </div>
                          <FilterChipGroup
                            className={styles.optionChips}
                            aria-label={group.label}
                            data-pdp-option-group={group.id}
                          >
                            {group.options.map((option) => (
                              <FilterChip
                                key={option.value}
                                selected={
                                  selectedOptions[group.id] === option.value
                                }
                                disabled={option.unavailable}
                                aria-label={
                                  option.unavailable
                                    ? `${option.label}, unavailable`
                                    : option.label
                                }
                                onClick={() =>
                                  setSelectedOptions((current) => ({
                                    ...current,
                                    [group.id]: option.value,
                                  }))
                                }
                              >
                                {option.label}
                              </FilterChip>
                            ))}
                          </FilterChipGroup>
                        </fieldset>
                      ))}
                    </div>

                    <p
                      className={styles.bestBefore}
                      data-slot="product-detail-best-before"
                    >
                      <span>{copy.bestBefore}</span> {bestBefore}
                    </p>
                    </div>
                  </section>

                  <section
                    className={styles.details}
                    aria-labelledby="product-highlights"
                    data-slot="product-detail-details"
                  >
                    <div
                      className={styles.detailModule}
                      data-pdp-detail-module="highlights"
                    >
                      <h2 id="product-highlights">{copy.productHighlights}</h2>
                      <ul className={styles.highlightList}>
                        {highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className={styles.detailModule}
                      data-pdp-detail-module="specifications"
                    >
                      <h2>{copy.specifications}</h2>
                      <dl className={styles.specificationList}>
                        {specifications.map((specification) => (
                          <div key={specification.label}>
                            <dt>{specification.label}</dt>
                            <dd>{specification.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div
                      className={styles.detailModule}
                      data-pdp-detail-module="disclaimer"
                    >
                      <h3>{copy.disclaimer}</h3>
                      <p className={styles.disclaimer}>{copy.disclaimerBody}</p>
                    </div>
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
                            <img
                              className={styles.sellerLogo}
                              src={yamiSellerLogo}
                              alt="YAMI"
                              width={95}
                              height={40}
                              data-slot="product-detail-seller-logo"
                            />
                          </div>
                        </div>
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
                              returnsIcon,
                              zipcodeIcon,
                            ];
                            const iconNames = [
                              "same-day",
                              "returns",
                              "zipcode",
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
                          >
                            {(showAllTags
                              ? purchaseTags
                              : purchaseTags.slice(0, 3)
                            ).map((tag) => (
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
            className={styles.reviews}
            data-pdp-module="reviews"
          />
        ) : null}

        {brandSection ? (
          <ProductList
            id="torriden-products"
            className={styles.brandProducts}
            title={
              <>
                <span>{brandSection.title}</span>
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
