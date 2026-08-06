import styles from "./Billboard.module.css";
import type { BillboardProps } from "./Billboard.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * A full-bleed promotional band whose entire content is one image.
 *
 * The artwork carries the offer, the styling and the call to action; the
 * component contributes the band, the link and the accessible name. That name
 * is a prop rather than something read off the artwork, because a reader has
 * no other way in — the words are pixels. It names the link as well as the
 * band: naming only the band leaves the link itself nameless, since an empty
 * alt gives it nothing to compute a name from.
 */
export function Billboard({
  image,
  href,
  label,
  imageLoading = "lazy",
  className,
  ...rest
}: BillboardProps) {
  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      data-slot="billboard"
      aria-label={label}
    >
      <a
        className={styles.link}
        href={href}
        aria-label={label}
        data-slot="billboard-link"
      >
        <picture>
          {image.mobile && (
            <source
              media="(max-width: 1023.98px)"
              srcSet={image.mobile.src}
              width={image.mobile.width}
              height={image.mobile.height}
            />
          )}
          <img
            className={styles.image}
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading={imageLoading}
            decoding="async"
            data-slot="billboard-image"
          />
        </picture>
      </a>
    </section>
  );
}
