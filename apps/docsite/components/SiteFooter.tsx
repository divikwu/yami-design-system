import { BookOpen01Icon, Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import type { SiteCopy } from "../content/site";
import type { Locale } from "../lib/locales";
import { localizedPath } from "../lib/locales";
import { githubUrl, siteVersion, storybookUrl } from "../lib/site-config";
import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
  locale: Locale;
  copy: SiteCopy;
}

export function SiteFooter({ locale, copy }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <nav className={styles.links} aria-label={copy.footer.resources}>
            <Link href={localizedPath(locale, "/docs/getting-started")}>{copy.nav.docs}</Link>
            <Link href={localizedPath(locale, "/blog")}>{copy.nav.blog}</Link>
          </nav>
          <div className={styles.externalLinks}>
            <a href={storybookUrl} target="_blank" rel="noreferrer" aria-label={copy.utilities.storybook} title={copy.utilities.storybook}>
              <HugeiconsIcon icon={BookOpen01Icon} size={16} strokeWidth={1.5} aria-hidden="true" />
            </a>
            <a href={githubUrl} target="_blank" rel="noreferrer" aria-label={copy.utilities.github} title={copy.utilities.github}>
              <HugeiconsIcon icon={Github01Icon} size={16} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.bottomRow}>
          <p>{copy.footer.version} {siteVersion} · {copy.footer.license}</p>
          <p>{"\u00A9"}{year} YAMI Design System</p>
        </div>
      </div>
    </footer>
  );
}
