"use client";

import { type ReactNode, useLayoutEffect } from "react";
import { Sheet } from "@yami/design-system";

export function ProductDetailSheet({ id, title, closeLabel, onClose, children }: {
  id: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) onClose(); };
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [onClose]);

  return (
    <Sheet open id={`product-${id}-sheet`} title={title} closeLabel={closeLabel} onClose={onClose} size="full" data-slot={`product-${id}-sheet`}>
      {children}
    </Sheet>
  );
}
