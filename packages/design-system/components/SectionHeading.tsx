import type { ReactNode } from "react";

import styles from "./SectionHeading.module.css";

export type SectionHeadingProps = {
  /** Links the heading to the section it labels. */
  id?: string;
  title: ReactNode;
  /** Shown below 1024px in place of `title`; omit to use one title at every width. */
  mobileTitle?: ReactNode;
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
  mobileTitle,
  viewAllHref,
  viewAllLabel,
  actions,
  slot,
  titleFontFamily = "sans",
  className,
  titleClassName,
  actionsClassName,
}: SectionHeadingProps) {
  const join = (...names: Array<string | undefined>) =>
    names.filter(Boolean).join(" ");
  const slotName = (suffix: string) => (slot ? `${slot}-${suffix}` : undefined);
  const resolvedViewAllHref = viewAllHref?.trim();

  return (
    <div className={join(styles.root, className)} data-slot={slotName("heading")}>
      <h2
        id={id}
        className={join(
          styles.title,
          titleFontFamily === "serif" ? styles.titleSerif : undefined,
          titleClassName,
        )}
        data-slot={slotName("title")}
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
