import type { ReactNode } from "react";

import styles from "./SectionHeading.module.css";

export type SectionHeadingProps = {
  /** Links the heading to the section it labels. */
  id?: string;
  title: ReactNode;
  /** Optional supporting copy rendered to the right of the title. */
  description?: ReactNode;
  /** Shown below 1024px in place of `title`; omit to use one title at every width. */
  mobileTitle?: ReactNode;
  /** Below 1024px: 20px normal; 16px Chinese 600 / English 500 via lang. Desktop: 24px. */
  mobileTitleSize?: 16 | 20;
  /**
   * Renders the canonical view-all pair — a text link on desktop, a circular
   * chevron on mobile — so a section does not restate it. Omit for a section
   * that has no collection page to link to.
   */
  viewAllHref?: string;
  viewAllLabel?: ReactNode;
  /** Rail paging, or whatever else the section puts after the view-all. */
  actions?: ReactNode;
  /**
   * Prefix for the `data-slot` attributes, e.g. `product-list` yields
   * `product-list-heading` / `-title` / `-actions`. Omit to render none —
   * these names are a public contract that consumers style and assert
   * against, so each section keeps the ones it already published.
   */
  slot?: string;
  titleFontFamily?: "sans" | "serif";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  actionsClassName?: string;
};

/**
 * The heading row shared by every section card. It owns the row layout, the
 * title's ellipsis behaviour, and the responsive title swap; the type scale,
 * colour and any surface treatment stay with the section, which passes them
 * through `titleClassName`.
 */
export function SectionHeading({
  id,
  title,
  description,
  mobileTitle,
  mobileTitleSize = 20,
  viewAllHref,
  viewAllLabel,
  actions,
  slot,
  titleFontFamily = "sans",
  className,
  titleClassName,
  descriptionClassName,
  actionsClassName,
}: SectionHeadingProps) {
  const join = (...names: Array<string | undefined>) =>
    names.filter(Boolean).join(" ");
  const slotName = (suffix: string) => (slot ? `${slot}-${suffix}` : undefined);
  const resolvedViewAllHref = viewAllHref?.trim();

  return (
    <div
      className={join(styles.root, className)}
      data-slot={slotName("heading")}
      data-description={description ? "true" : undefined}
    >
      <div className={styles.copy} data-slot={slotName("copy")}>
        <h2
          id={id}
          className={join(
            styles.title,
            titleFontFamily === "serif" ? styles.titleSerif : undefined,
            titleClassName,
          )}
          data-slot={slotName("title")}
          data-mobile-title-size={mobileTitleSize}
        >
          {mobileTitle === undefined ? (
            title
          ) : (
            <>
              <span className={styles.titleDesktop}>{title}</span>
              <span className={styles.titleMobile}>{mobileTitle}</span>
            </>
          )}
        </h2>
        {description ? (
          <p
            className={join(styles.description, descriptionClassName)}
            data-slot={slotName("description")}
          >
            {description}
          </p>
        ) : null}
      </div>
      {resolvedViewAllHref || actions ? (
        <div
          className={join(styles.actions, actionsClassName)}
          data-slot={slotName("actions")}
        >
          {resolvedViewAllHref && (
            <>
              <a
                className={styles.viewAll}
                href={resolvedViewAllHref}
                data-slot={slotName("view-all")}
              >
                {viewAllLabel}
              </a>
              <a
                className={styles.viewAllMobile}
                href={resolvedViewAllHref}
                data-slot={slotName("view-all-mobile")}
              >
                <span className={styles.srOnly}>{viewAllLabel}</span>
                <span
                  className={styles.viewAllIcon}
                  data-icon="chevron-right"
                  aria-hidden="true"
                />
              </a>
            </>
          )}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
