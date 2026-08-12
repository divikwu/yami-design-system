import type { Metadata } from "next";

import { StandaloneEcommerceHome } from "../ui/standalone-ecommerce-home";

export const metadata: Metadata = {
  title: "Ecommerce Home | Yami",
  description: "Explore the Yami ecommerce homepage prototype.",
};

export default function EcommerceHomePage() {
  return <StandaloneEcommerceHome />;
}
