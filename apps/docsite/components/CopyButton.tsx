"use client";

import { Copy01Icon, Link01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@yami/design-system";
import { useEffect, useRef, useState } from "react";

export function CopyButton({ value, label, copiedLabel, errorLabel, kind = "code" }: {
  value: string;
  label: string;
  copiedLabel: string;
  errorLabel: string;
  kind?: "code" | "link";
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const feedback = status === "copied" ? copiedLabel : status === "error" ? errorLabel : "";

  return (
    <>
      <Button variant="tertiary" form="icon" size="sm" aria-label={status === "copied" ? copiedLabel : label} title={feedback || label}
        onClick={async () => {
          clearTimeout(timer.current);
          try {
            const url = new URL(window.location.href);
            url.hash = value;
            await navigator.clipboard.writeText(kind === "link" ? url.href : value);
            setStatus("copied");
          } catch {
            setStatus("error");
          }
          timer.current = setTimeout(() => setStatus("idle"), 2000);
        }}
      >
        <HugeiconsIcon icon={status === "copied" ? Tick02Icon : kind === "link" ? Link01Icon : Copy01Icon} size={16} strokeWidth={1.5} aria-hidden="true" />
      </Button>
      <span className="visually-hidden" role="status">{feedback}</span>
    </>
  );
}
