"use client";

import {
  createEcommerceHomeFixture,
  EcommerceHomeTemplate,
} from "@yami/prototypes";
import "@yami/design-system/styles/base.css";

export function StandaloneEcommerceHome() {
  return (
    <div className="prototype-root" data-theme="light">
      <EcommerceHomeTemplate {...createEcommerceHomeFixture("en")} />
    </div>
  );
}
