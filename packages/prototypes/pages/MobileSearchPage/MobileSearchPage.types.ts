import type { ComponentProps } from "react";

export interface MobileSearchSuggestion {
  label: string;
  image?: string;
}

export interface MobileSearchPageProps
  extends Omit<ComponentProps<"div">, "children"> {
  initialQuery?: string;
  backHref?: string;
}
