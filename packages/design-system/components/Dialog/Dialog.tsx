"use client";

import { type ComponentPropsWithoutRef, type ReactNode, useId, useLayoutEffect, useRef } from "react";
import { Button } from "../Button";
import styles from "./Dialog.module.css";

const closeIcon = new URL("../../assets/icons/action/close.svg", import.meta.url).href;

interface DialogBaseProps extends Omit<ComponentPropsWithoutRef<"dialog">, "open" | "title" | "onClose" | "onCancel" | "role"> {
  open: boolean;
  title: string;
  onClose: () => void;
  role?: "dialog" | "alertdialog";
  /** Remains outside the scrolling content. The caller owns its actions. */
  footer?: ReactNode;
  "data-slot"?: string;
}

export type DialogProps = DialogBaseProps & (
  | { variant?: "default"; closeLabel: string }
  | { variant: "confirmation"; closeLabel?: never }
);

export function Dialog({
  open, title, closeLabel, onClose, role = "dialog", variant = "default", footer,
  id: providedId, className, children, onClick, onKeyDown, "data-slot": slot = "dialog", ...rest
}: DialogProps) {
  const generatedId = useId();
  const id = providedId ?? `dialog-${generatedId}`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const opener = dialog.ownerDocument.activeElement as HTMLElement | null;
    dialog.showModal();
    const firstControl = dialog.querySelector<HTMLElement>("button, a[href], input, select, textarea, [tabindex]");
    (closeRef.current ?? firstControl)?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      queueMicrotask(() => {
        if (opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
      });
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      {...rest}
      ref={dialogRef}
      id={id}
      role={role}
      className={[styles.dialog, className].filter(Boolean).join(" ")}
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      data-slot={slot}
      data-dialog=""
      data-variant={variant}
      onClose={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget && !dialogRef.current?.open) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        event.stopPropagation();
        if (event.defaultPrevented) return;
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        } else if (event.key === "Tab") {
          const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]")]
            .filter((control) => control.tabIndex >= 0 && !control.matches(":disabled") && control.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          const active = event.currentTarget.ownerDocument.activeElement;
          if (event.shiftKey && active === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div className={styles.body} data-slot="dialog-body">
        <header className={styles.header} data-slot="dialog-header">
          <h2 className={styles.title} id={`${id}-title`}>{title}</h2>
          {variant !== "confirmation" && (
            <Button ref={closeRef} className={styles.closeButton} variant="tertiary" form="icon" size="sm" aria-label={closeLabel} onClick={onClose}>
              <img src={closeIcon} alt="" width={20} height={20} />
            </Button>
          )}
        </header>
        <div className={styles.content} data-slot={`${id}-content`} data-dialog-content="">
          {children}
        </div>
      </div>
      {footer && <div className={styles.footer} data-slot="dialog-footer">{footer}</div>}
    </dialog>
  );
}
