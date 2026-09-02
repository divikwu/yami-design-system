import type { Locale } from "../../lib/locales";
import { en } from "./en";
import type { SiteCopy } from "./types";
import { zh } from "./zh";

const copies: Record<Locale, SiteCopy> = { zh, en };

export function getSiteCopy(locale: Locale): SiteCopy {
  return copies[locale];
}

export type { SiteCopy } from "./types";
