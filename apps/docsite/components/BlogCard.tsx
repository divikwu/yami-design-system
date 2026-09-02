import Link from "next/link";

import { BlogCover, type BlogCoverData } from "./BlogCover";
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
  cover?: BlogCoverData;
  coverAlt?: string;
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
        <BlogCover
          cover={post.cover}
          alt={post.coverAlt}
          className={styles.cover}
        />
        <div className={styles.content}>
          <h2>{post.title}</h2>
          {landing ? (
            <p className={styles.landingDate}>{post.dateLabel}</p>
          ) : (
            <>
              <p className={styles.description}>{post.description}</p>
              <div className={styles.byline}>
                <span>{post.dateLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{post.readingTimeLabel}</span>
              </div>
            </>
          )}
          {landing ? <p className={styles.description}>{post.description}</p> : null}
        </div>
      </Link>
    </article>
  );
}
