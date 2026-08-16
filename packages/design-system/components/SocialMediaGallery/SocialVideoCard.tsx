import styles from "./SocialMediaGallery.module.css";
import { ResponsiveImage } from "../ResponsiveImage";
import type {
  SocialVideoCardProps,
  SocialVideoProduct,
} from "./SocialMediaGallery.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ProductImage({
  product,
  index,
}: {
  product: SocialVideoProduct;
  index?: number;
}) {
  const image = (
    <ResponsiveImage
      className={styles.productImage}
      source={product.imageSrc}
      alt={product.imageAlt}
      loading="lazy"
      decoding="async"
    />
  );

  if (!product.href) {
    return (
      <span className={styles.productLink} data-product-index={index}>
        {image}
      </span>
    );
  }

  return (
    <a
      className={styles.productLink}
      href={product.href}
      data-product-index={index}
    >
      {image}
    </a>
  );
}

function CardMedia({
  href,
  posterSrc,
  posterAlt,
}: Pick<SocialVideoCardProps, "href" | "posterSrc" | "posterAlt">) {
  const media = (
    <ResponsiveImage
      className={styles.poster}
      source={posterSrc}
      alt={posterAlt}
      loading="lazy"
      decoding="async"
    />
  );

  if (!href) return media;

  return (
    <a className={styles.mediaLink} href={href}>
      {media}
    </a>
  );
}

export function SocialVideoCard({
  id,
  posterSrc,
  posterAlt,
  username,
  platformIconSrc,
  caption,
  href,
  products = [],
  additionalProductCount = 0,
  className,
  ...rest
}: SocialVideoCardProps) {
  const visibleProducts = products.slice(0, 3);
  const productMode =
    visibleProducts.length === 0
      ? "text"
      : visibleProducts.length === 1
        ? "single"
        : "multiple";

  /* A narrow card cannot seat three thumbnails and the overflow count — the
   * count gets squeezed and its text clipped. Both rows render and a container
   * query on the card picks one, so the choice follows the card's real width
   * rather than the viewport's (the two do not track: at 1439px a card is
   * 256px wide, at 1440px the rail switches to six per view and the same card
   * drops to 211px). Rendering both also keeps the overflow number correct,
   * which hiding the third thumbnail in CSS alone could not. */
  const wideOverflow =
    Math.max(0, products.length - 3) + additionalProductCount;
  const narrowOverflow =
    Math.max(0, products.length - 2) + additionalProductCount;

  return (
    <article
      {...rest}
      id={id}
      className={cx(styles.card, className)}
      data-slot="social-video-card"
      data-product-mode={productMode}
      data-has-products={visibleProducts.length > 0 ? "true" : "false"}
    >
      <div className={styles.media} data-slot="social-video-card-media">
        <CardMedia href={href} posterSrc={posterSrc} posterAlt={posterAlt} />

        <div className={styles.identity}>
          <ResponsiveImage
            className={styles.platform}
            source={platformIconSrc}
            alt=""
            aria-hidden="true"
            width="24"
            height="24"
          />
          <span className={styles.handle}>{username}</span>
        </div>
      </div>

      <div
        className={styles.products}
        data-slot="social-video-card-products"
        data-footer-mode={productMode}
      >
        {visibleProducts.length === 0 ? (
          <p className={styles.footerText}>{caption}</p>
        ) : productMode === "single" ? (
          <>
            <ProductImage product={visibleProducts[0]} />
            {visibleProducts[0].title && (
              <span className={styles.productTitle}>
                {visibleProducts[0].title}
              </span>
            )}
          </>
        ) : (
          <>
            <span className={styles.productRow} data-product-row="responsive">
              {visibleProducts.map((product, index) => (
                <ProductImage
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
              {wideOverflow > 0 && (
                <span
                  className={`${styles.moreProducts} ${styles.wideCount}`}
                  data-product-overflow="wide"
                >
                  +{wideOverflow}
                </span>
              )}
              {narrowOverflow > 0 && (
                <span
                  className={`${styles.moreProducts} ${styles.narrowCount}`}
                  data-product-overflow="narrow"
                >
                  +{narrowOverflow}
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </article>
  );
}
