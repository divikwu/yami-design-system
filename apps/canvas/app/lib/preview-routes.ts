export type PreviewSearchParams = Record<string, string | string[] | undefined>;

export function previewRoute(searchParams: PreviewSearchParams, locale: "en" | "zh") {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  query.set("locale", locale);
  return `/preview?${query.toString()}`;
}
