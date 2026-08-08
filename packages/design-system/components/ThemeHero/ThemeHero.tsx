import { Button } from "../Button";
import styles from "./ThemeHero.module.css";
import type { ThemeHeroProps } from "./ThemeHero.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Theme storytelling hero with selectable copy, one primary action and a
 * campaign image repeated as a blurred full-bleed atmosphere.
 */
export function ThemeHero({
  title,
  description,
  image,
  backgroundImageSrc = image.src,
  cta,
  imageLoading = "lazy",
  className,
  ...rest
}: ThemeHeroProps) {
  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      data-slot="theme-hero"
    >
      <div
        className={styles.atmosphere}
        data-slot="theme-hero-atmosphere"
        aria-hidden="true"
      >
        <img src={backgroundImageSrc} alt="" />
      </div>
      <div
        className={styles.scrim}
        data-slot="theme-hero-scrim"
        aria-hidden="true"
      />

      <div className={styles.container}>
        <div className={styles.copy} data-slot="theme-hero-copy">
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

        <div className={styles.media} data-slot="theme-hero-media">
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
