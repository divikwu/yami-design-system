"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { getSiteCopy } from "../../content/site";
import { isLocale, localizedPath } from "../../lib/locales";
import styles from "./not-found.module.css";

export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const localeParam = params.locale ?? "";
  const locale = isLocale(localeParam) ? localeParam : "zh";
  const copy = getSiteCopy(locale);

  return (
    <main id="main-content" className={styles.main}>
      <p className="eyebrow">404</p>
      <h1>{copy.notFound.title}</h1>
      <p className={styles.description}>{copy.notFound.description}</p>
      <Link className={styles.action} href={localizedPath(locale)}>{copy.notFound.action}</Link>
    </main>
  );
}
