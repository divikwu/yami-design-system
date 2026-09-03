"use client";

import { Button } from "@yami/design-system";
import { useId, useState } from "react";

import { CopyButton } from "./CopyButton";

import styles from "./CodeBlock.module.css";

export function CodeBlock({
  code,
  language,
  copyLabel,
  copiedLabel,
  errorLabel,
  collapsible,
}: {
  code: string;
  language: string;
  copyLabel: string;
  copiedLabel: string;
  errorLabel: string;
  collapsible?: { expandLabel: string; collapseLabel: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const codeId = useId();

  return (
    <div className={styles.root} data-wrap={!language || language === "text" || Boolean(collapsible)} data-collapsed={collapsible ? !expanded : undefined}>
      <div className={styles.header}>
        <span>{language || "text"}</span>
        <CopyButton value={code} label={copyLabel} copiedLabel={copiedLabel} errorLabel={errorLabel} />
      </div>
      <pre id={codeId} tabIndex={0} aria-label={language || "text"}><code>{code}</code></pre>
      {collapsible ? (
        <div className={styles.footer}>
          <Button variant="tertiary" form="inline" size="sm" aria-expanded={expanded} aria-controls={codeId} onClick={() => setExpanded(!expanded)}>
            {expanded ? collapsible.collapseLabel : collapsible.expandLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
