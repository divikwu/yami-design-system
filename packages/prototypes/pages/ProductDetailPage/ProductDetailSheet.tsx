"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";
import { Button } from "@yami/design-system";
import styles from "./ProductDetailSheet.module.css";

const closeIcon = new URL("../../../design-system/assets/icons/action/close.svg", import.meta.url).href;

export function ProductDetailSheet({ id, title, closeLabel, onClose, children }: {
  id: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sheetId = `product-${id}-sheet`;

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const document = dialog.ownerDocument;
    const opener = document.activeElement as HTMLElement | null;
    const desktop = document.defaultView!.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) dialog.close(); };
    dialog.showModal();
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      queueMicrotask(() => {
        if (opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
      });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      id={sheetId}
      className={styles.sheet}
      aria-labelledby={`${sheetId}-title`}
      data-slot={sheetId}
      data-pdp-detail-sheet={id}
      onClose={() => { if (!dialogRef.current?.open) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          dialogRef.current?.close();
        } else if (event.key === "Tab") {
          const controls = event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], select");
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
      <div className={styles.header}>
        <div className={styles.actions}>
          <Button className={styles.closeButton} variant="tertiary" form="icon" size="sm" aria-label={closeLabel} onClick={() => dialogRef.current?.close()}>
            <img src={closeIcon} alt="" width={24} height={24} />
          </Button>
        </div>
        <h2 className={styles.title} id={`${sheetId}-title`}>{title}</h2>
      </div>
      <div className={styles.content} data-slot={`${sheetId}-content`}>
        {children}
      </div>
    </dialog>
  );
}
