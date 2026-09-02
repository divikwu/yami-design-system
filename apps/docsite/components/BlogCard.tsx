import Link from "next/link";

import { brandIcon } from "./assets";
import styles from "./BlogCard.module.css";

export interface BlogCardData {
  slug: string;
  href: string;
  title: string;
  description: string;
  categoryLabel: string;
  dateLabel: string;
  readingTimeLabel: string;
  authorLabel: string;
}

export function BlogCard({
  post,
  feature = false,
  landing,
}: {
  post: BlogCardData;
  feature?: boolean;
  landing?: "feature" | "compact";
}) {
  return (
    <article className={styles.article} data-feature={feature || undefined} data-landing={landing}>
      <Link className={styles.link} href={post.href}>
        <div className={styles.cover}>
          {landing ? null : <img src={brandIcon} alt="" width={feature ? 64 : 48} height={feature ? 64 : 48} />}
          <span>{post.categoryLabel}</span>
        </div>
        <div className={styles.content}>
          <h2>{post.title}</h2>
          {landing ? (
            <p className={styles.landingDate}>{post.dateLabel}</p>
          ) : (
            <div className={styles.byline}>
              <img src={brandIcon} alt="" width={20} height={20} />
              <span>{post.authorLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{post.dateLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{post.readingTimeLabel}</span>
            </div>
          )}
          <p className={styles.description}>{post.description}</p>
        </div>
      </Link>
    </article>
  );
}
