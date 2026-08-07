import { Button } from "../Button";
import styles from "./BrandHero.module.css";
import type { BrandHeroProps } from "./BrandHero.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Brand storytelling hero with selectable copy, one primary action and a
 * campaign image repeated as a blurred full-bleed atmosphere.
 */
export function BrandHero({
  title,
  description,
  image,
  backgroundImageSrc = image.src,
  cta,
  imageLoading = "lazy",
  className,
  ...rest
}: BrandHeroProps) {
  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      data-slot="brand-hero"
    >
      <div className={styles.atmosphere} aria-hidden="true">
        <img src={backgroundImageSrc} alt="" />
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.copy} data-slot="brand-hero-copy">
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.description}>{description}</div>
          {cta && (
            <div className={styles.cta}>
              <Button
                className={styles.ctaButton}
                variant="primary"
                form="full"
                size="md"
                inverse
                disabled={cta.disabled}
                aria-label={cta.ariaLabel}
                onClick={cta.onClick}
              >
                {cta.label}
              </Button>
            </div>
          )}
        </div>

        <div className={styles.media} data-slot="brand-hero-media">
          <img
            className={styles.image}
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading={imageLoading}
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
