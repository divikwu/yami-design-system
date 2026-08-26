"use client";

import type { CSSProperties } from "react";
import { useId, useLayoutEffect, useRef, useState } from "react";

import { AdaptiveImageScrim } from "../AdaptiveImageScrim";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { heroBannerPalette } from "../HeroBanner/imageColor";
import { useImageBottomColor } from "../HeroBanner/useImageBottomColor";
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

const DESCRIPTION_LINE_LIMIT = {
  desktop: 3,
  mobile: 2,
} as const;

/**
 * Theme storytelling hero with selectable copy, optional primary and secondary
 * actions, and a campaign image repeated as a blurred full-bleed atmosphere.
 */
export function ThemeHero({
  title,
  description,
  descriptionExpandLabel = "More",
  descriptionCollapseLabel = "Less",
  tags,
  tagSize = "sm",
  tagTone = "dark",
  image,
  backgroundImageSrc = image.src,
  backgroundColor,
  cta,
  secondaryCta,
  imageLoading = "lazy",
  className,
  style,
  ...rest
}: ThemeHeroProps) {
  const titleId = useId();
  const descriptionId = useId();
  const descriptionRef = useRef<HTMLDivElement>(null);
  const descriptionCopyRef = useRef<HTMLSpanElement>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionCanExpand, setDescriptionCanExpand] = useState(false);
  const [collapsedDescription, setCollapsedDescription] = useState<string | null>(
    null,
  );
  const descriptionString =
    typeof description === "string" || typeof description === "number"
      ? String(description)
      : null;
  const imageColor = useImageBottomColor(
    image.src,
    backgroundColor ?? "#000000",
  );
  const mobilePalette = heroBannerPalette(imageColor);
  const rootStyle = {
    ...style,
    "--adaptive-image-scrim-surface-color": mobilePalette.surfaceColor,
  } as CSSProperties;

  useLayoutEffect(() => {
    const element = descriptionRef.current;
    const copy = descriptionCopyRef.current;
    if (!element || !copy || descriptionExpanded) return;
    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");

    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
      const lineLimit = desktopMediaQuery.matches
        ? DESCRIPTION_LINE_LIMIT.desktop
        : DESCRIPTION_LINE_LIMIT.mobile;
      const maxHeight = lineHeight * lineLimit + 1;

      if (descriptionString === null) {
        setDescriptionCanExpand(element.scrollHeight > maxHeight);
        setCollapsedDescription(null);
        return;
      }

      const renderedText = copy.textContent;
      const renderedMeasuringState = element.dataset.measuring;
      const renderedToggle = element.querySelector<HTMLElement>(
        '[data-slot="theme-hero-description-toggle"]',
      );
      const renderedToggleDisplay = renderedToggle?.style.display;
      if (renderedToggle) renderedToggle.style.display = "none";

      element.dataset.measuring = "true";
      copy.textContent = descriptionString;
      const overflows = element.scrollHeight > maxHeight;

      if (!overflows) {
        copy.textContent = renderedText;
        if (renderedMeasuringState === undefined) {
          delete element.dataset.measuring;
        } else {
          element.dataset.measuring = renderedMeasuringState;
        }
        if (renderedToggle) renderedToggle.style.display = renderedToggleDisplay ?? "";
        setDescriptionCanExpand(false);
        setCollapsedDescription(null);
        return;
      }

      const measuringToggle = document.createElement("button");
      measuringToggle.type = "button";
      measuringToggle.className = styles.descriptionToggle;
      measuringToggle.textContent =
        typeof descriptionExpandLabel === "string" ||
        typeof descriptionExpandLabel === "number"
          ? String(descriptionExpandLabel)
          : "More";
      measuringToggle.tabIndex = -1;
      measuringToggle.setAttribute("aria-hidden", "true");
      element.append(measuringToggle);

      let low = 0;
      let high = descriptionString.length;
      let bestFit = "";
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const candidate = `${descriptionString.slice(0, middle).trimEnd()}…`;
        copy.textContent = candidate;
        if (element.scrollHeight <= maxHeight) {
          bestFit = candidate;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      measuringToggle.remove();
      copy.textContent = renderedText;
      if (renderedMeasuringState === undefined) {
        delete element.dataset.measuring;
      } else {
        element.dataset.measuring = renderedMeasuringState;
      }
      if (renderedToggle) renderedToggle.style.display = renderedToggleDisplay ?? "";
      setCollapsedDescription(bestFit);
      setDescriptionCanExpand(true);
    };

    measure();
    let measuredWidth = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === measuredWidth) return;
      measuredWidth = element.clientWidth;
      measure();
    });
    observer.observe(element);
    desktopMediaQuery.addEventListener("change", measure);
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
      desktopMediaQuery.removeEventListener("change", measure);
    };
  }, [description, descriptionExpandLabel, descriptionExpanded, descriptionString]);

  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      style={rootStyle}
      data-slot="theme-hero"
      data-mobile-foreground={mobilePalette.foreground}
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
        aria-hidden="true"
      />

      <div className={styles.container} data-slot="theme-hero-container">
        <div className={styles.copy} data-slot="theme-hero-copy">
          <div
            className={styles.copyContent}
            data-slot="theme-hero-copy-content"
          >
            <AdaptiveImageScrim
              className={styles.mobileScrim}
              data-slot="theme-hero-scrim"
            />
            <h2 id={titleId} className={styles.title} data-slot="theme-hero-title">
              {title}
            </h2>
            <div
              className={styles.description}
              data-slot="theme-hero-description"
              data-expandable={descriptionCanExpand || undefined}
              data-expanded={descriptionExpanded}
            >
              <div
                ref={descriptionRef}
                className={styles.descriptionText}
                data-slot="theme-hero-description-text"
              >
                <span
                  ref={descriptionCopyRef}
                  id={descriptionId}
                  data-slot="theme-hero-description-copy"
                >
                  {descriptionExpanded
                    ? description
                    : (collapsedDescription ?? description)}
                </span>
                {descriptionCanExpand && (
                  <button
                    type="button"
                    className={styles.descriptionToggle}
                    data-slot="theme-hero-description-toggle"
                    aria-controls={descriptionId}
                    aria-expanded={descriptionExpanded}
                    onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                  >
                    {descriptionExpanded
                      ? descriptionCollapseLabel
                      : descriptionExpandLabel}
                  </button>
                )}
              </div>
            </div>
            {tags && tags.length > 0 && (
              <ul
                className={styles.tags}
                data-slot="theme-hero-tags"
                aria-labelledby={titleId}
                tabIndex={0}
              >
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
        </div>

        <div className={styles.media} data-slot="theme-hero-media">
          <img
            ref={prepareProgressiveImage}
            className={styles.image}
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
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
