"use client";

import { CopyButton } from "./CopyButton";

import styles from "./CodeBlock.module.css";

export function CodeBlock({
  code,
  language,
  copyLabel,
  copiedLabel,
  errorLabel,
}: {
  code: string;
  language: string;
  copyLabel: string;
  copiedLabel: string;
  errorLabel: string;
}) {
  return (
    <div className={styles.root} data-wrap={!language || language === "text"}>
      <div className={styles.header}>
        <span>{language || "text"}</span>
        <CopyButton value={code} label={copyLabel} copiedLabel={copiedLabel} errorLabel={errorLabel} />
      </div>
      <pre tabIndex={0} aria-label={language || "text"}><code>{code}</code></pre>
    </div>
  );
}
