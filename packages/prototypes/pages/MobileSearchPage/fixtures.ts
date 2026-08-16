import type { MobileSearchSuggestion } from "./MobileSearchPage.types";

const coffeeImage = new URL("./assets/coffee.png", import.meta.url).href;
const candyImage = new URL("./assets/coffee-candy.png", import.meta.url).href;
const jellyImage = new URL("./assets/coffee-jelly.png", import.meta.url).href;
const mugImage = new URL("./assets/coffee-mug.png", import.meta.url).href;
const cupImage = new URL("./assets/coffee-cup.png", import.meta.url).href;
const makerImage = new URL("./assets/coffee-maker.png", import.meta.url).href;

interface MobileSearchLink {
  label: string;
  href: string;
  badge?: string;
}

const yamiSearchHref = (query: string) =>
  `https://www.yami.com/us/en/search?q=${encodeURIComponent(query)}`;

const mobileSearchResultsHref =
  "/?path=/story/yami-pages-search-results--mobile&globals=locale%3Aen";

const recentSearchLabels = [
  "Coffee",
  "korean spicy noodle",
  "Japanese candy",
  "ramen",
  "coffee",
  "wet wipes",
  "milk tea",
] as const;
export const recentSearches: readonly MobileSearchLink[] =
  recentSearchLabels.map((label) => ({
    label,
    href: mobileSearchResultsHref,
  }));

const popularSearchLabels = [
  "Matcha powder",
  "Miffy",
  "Moisturizer",
  "Flower knows",
  "Tretinoin",
  "Sunscreen spray",
  "Skin1004",
  "Orbis",
  "Beauty of joseon sunscreen",
  "Oreo",
] as const;
export const popularSearches: readonly MobileSearchLink[] =
  popularSearchLabels.map((label) => ({
    label,
    href: mobileSearchResultsHref,
  }));

export const hotDeals: readonly MobileSearchLink[] = [
  { label: "Father's Day Gifts", href: yamiSearchHref("Father's Day Gifts") },
  { label: "C-Beauty Spotlight", href: yamiSearchHref("C-Beauty Spotlight"), badge: "Sale" },
  { label: "Monchhichi, Hello Kitty, and More!", href: yamiSearchHref("Monchhichi Hello Kitty") },
  { label: "Natural Korean Skincare iUNIK New", href: yamiSearchHref("iUNIK skincare"), badge: "Sale" },
  { label: "K-Pharmacy Trendy Picks Hot", href: yamiSearchHref("K-Pharmacy"), badge: "Sale" },
  { label: "K-Pharmacy Trendy Picks Hot", href: yamiSearchHref("K-Pharmacy"), badge: "Sale" },
];

export const coffeeSuggestions: readonly MobileSearchSuggestion[] = [
  { label: "coffee", image: coffeeImage },
  { label: "coffee candy", image: candyImage },
  { label: "coffee jelly", image: jellyImage },
  { label: "coffee mug", image: mugImage },
  { label: "coffee cup", image: cupImage },
  { label: "coffee maker", image: makerImage },
  { label: "coffee milk" },
  { label: "coffee milk" },
];
