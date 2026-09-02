export type SearchEntryType = "page" | "doc" | "blog";

export interface SearchEntry {
  id: string;
  type: SearchEntryType;
  title: string;
  description: string;
  href: string;
  keywords: string[];
  headings: Array<{ id: string; text: string }>;
  body: string;
}

export interface SearchResult extends SearchEntry {
  score: number;
  match: string;
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function includes(value: string, query: string): boolean {
  return normalize(value).includes(query);
}

export function rankSearchEntries(
  entries: SearchEntry[],
  rawQuery: string,
  limit = 10,
): SearchResult[] {
  const query = normalize(rawQuery);
  if (!query) return [];

  return entries
    .map((entry): SearchResult | null => {
      const title = normalize(entry.title);
      const titleContains = title.includes(query);
      const matchingKeyword = entry.keywords.find((keyword) => includes(keyword, query));
      const matchingHeading = entry.headings.find((heading) => includes(heading.text, query));
      const descriptionMatches = includes(entry.description, query);
      const bodyMatches = includes(entry.body, query);

      let score = 0;
      if (title === query) score = 100;
      else if (title.startsWith(query)) score = 80;
      else if (matchingKeyword || titleContains) score = 55;
      else if (matchingHeading) score = 45;
      else if (descriptionMatches) score = 30;
      else if (bodyMatches) score = 10;

      if (score === 0) return null;
      return {
        ...entry,
        score,
        match: matchingHeading?.text ?? matchingKeyword ?? (titleContains ? entry.title : entry.description),
      };
    })
    .filter((entry): entry is SearchResult => entry !== null)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
