import styles from "./BlogCover.module.css";

export interface BlogCoverData {
  src: string;
  eyebrow?: string;
  title?: string;
}

export function BlogCover({
  cover,
  alt,
  className,
  cornerLabel,
}: {
  cover?: BlogCoverData;
  alt?: string;
  className?: string;
  cornerLabel?: string;
}) {
  return (
    <div
      className={`${styles.cover}${className ? ` ${className}` : ""}`}
      data-image={cover ? true : undefined}
      role={cover ? "img" : undefined}
      aria-label={cover ? alt ?? cover.title : undefined}
    >
      {cover ? (
        <>
          <img src={cover.src} alt="" />
          {cover.eyebrow && cover.title ? (
            <span className={styles.copy} aria-hidden="true">
              <span className={styles.eyebrow}>{cover.eyebrow}</span>
              <span className={styles.title}>{cover.title}</span>
            </span>
          ) : null}
        </>
      ) : null}
      {cornerLabel ? <span className={styles.cornerLabel}>{cornerLabel}</span> : null}
    </div>
  );
}
