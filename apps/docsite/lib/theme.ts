export type Theme = "light" | "dark";
export type StoredTheme = Theme | null;

export const themeStorageKey = "yami-docsite-theme";

export function isStoredTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(value: string | null, systemPrefersDark: boolean): Theme {
  if (isStoredTheme(value)) return value;
  return systemPrefersDark ? "dark" : "light";
}
