import { Badge } from "../Badge";
import { Button } from "../Button";
import {
  handleProgressiveImageError,
  handleProgressiveImageLoad,
  prepareProgressiveImage,
} from "../progressiveImage";
import styles from "./ThemeHero.module.css";
import type { ThemeHeroProps } from "./ThemeHero.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Theme storytelling hero with selectable copy, optional primary and secondary
 * actions, and a campaign image repeated as a blurred full-bleed atmosphere.
 */
export function ThemeHero({
  title,
  description,
  tags,
  tagSize = "sm",
  tagTone = "dark",
  image,
  backgroundImageSrc = image.src,
  cta,
  secondaryCta,
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
        <img
          src={backgroundImageSrc}
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority="low"
        />
      </div>
      <div
        className={styles.scrim}
        data-slot="theme-hero-scrim"
        aria-hidden="true"
      />

      <div className={styles.container} data-slot="theme-hero-container">
        <div className={styles.copy} data-slot="theme-hero-copy">
          <h2 className={styles.title} data-slot="theme-hero-title">
            {title}
          </h2>
          <div
            className={styles.description}
            data-slot="theme-hero-description"
          >
            {description}
          </div>
          {tags && tags.length > 0 && (
            <ul className={styles.tags} data-slot="theme-hero-tags">
              {tags.map((tag, index) => (
                <li key={`${tag}-${index}`}>
                  <Badge
                    className={styles.tagBadge}
                    size={tagSize}
                    tone={tagTone}
                  >
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {(cta || secondaryCta) && (
            <div
              className={styles.actions}
              data-slot="theme-hero-actions"
              data-action-count={cta && secondaryCta ? "2" : "1"}
            >
              {cta && (
                <Button
                  className={styles.actionButton}
                  variant="primary"
                  form="inline"
                  size="md"
                  inverse
                  data-action="primary"
                  disabled={cta.disabled}
                  aria-label={cta.ariaLabel}
                  aria-controls={cta.controls}
                  onClick={cta.onClick}
                >
                  {cta.label}
                </Button>
              )}
              {secondaryCta && (
                <Button
                  className={cx(
                    styles.actionButton,
                    styles.secondaryActionButton,
                  )}
                  variant="tertiary"
                  form="inline"
                  size="md"
                  inverse
                  data-action="secondary"
                  disabled={secondaryCta.disabled}
                  aria-label={secondaryCta.ariaLabel}
                  aria-controls={secondaryCta.controls}
                  onClick={secondaryCta.onClick}
                >
                  {secondaryCta.label}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className={styles.media} data-slot="theme-hero-media">
          <img
            ref={prepareProgressiveImage}
            className={styles.image}
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading={imageLoading}
            decoding="async"
            fetchPriority={imageLoading === "eager" ? "high" : undefined}
            onLoad={handleProgressiveImageLoad}
            onError={handleProgressiveImageError}
          />
        </div>
      </div>
    </section>
  );
}
