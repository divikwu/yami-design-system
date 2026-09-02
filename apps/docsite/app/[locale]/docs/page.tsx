import { redirect } from "next/navigation";

import { isLocale, localizedPath } from "../../../lib/locales";

export default async function DocsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(localizedPath(isLocale(locale) ? locale : "zh", "/docs/getting-started"));
}
