import reference from "./reference.json";

export type AppDownloadLocale = "ko" | "en";
export type CampaignProduct = (typeof reference.products)[number];
export const campaignProducts = reference.products;
export const featuredProducts = reference.featuredIds.map(
  (sku) => campaignProducts.find((product) => product.sku === sku)!,
);
export const campaignCopy = reference.copy;
export const footerGroups = reference.footer;
export const categories = ["beauty", "kitchen-appliance", "kitchen-cookware", "home"] as const;
export const categoryLabels = {
  ko: ["뷰티", "주방가전", "주방용품", "홈·리빙"],
  en: ["Beauty", "Kitchen Appliances", "Cookware", "Home & Living"],
};
export const appStoreHref = "https://apps.apple.com/us/app/yami-shop-all-of-asias-best/id981366229";
export const playStoreHref = "https://play.google.com/store/apps/details?id=com.yamibuy.yamiapp";
export const downloadHref = "https://yami-app-download.vercel.app/get-app";
export const productHref = (product: CampaignProduct, locale: AppDownloadLocale) =>
  `https://www.yami.com/us/${locale}/${product.slug}`;
export const asset = (name: string) => new URL(`./assets/${name}`, import.meta.url).href;
export const productImage = (product: CampaignProduct) => asset(product.image.split("/").pop()!);
export const money = (amount: number) => `$${amount.toFixed(2)}`;

/** Reference campaign rules; money is calculated in cents to avoid rounding drift. */
export function calculateSavings(mode: "welcome" | "app", amount: number, products: CampaignProduct[] = []) {
  const subtotal = mode === "welcome" ? Math.round(amount * 100)
    : products.reduce((sum, product) => sum + Math.round(product.yamiPrice * 100), 0);
  const discount = mode === "welcome" ? 1000 + Math.round(subtotal * 0.1)
    : products.reduce((sum, product) => sum + Math.round(product.yamiPrice * 100) - Math.round(product.appPrice * 100), 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const freeShipping = afterDiscount >= 4900;
  const shipping = subtotal === 0 || freeShipping ? 0 : 599;
  return {
    subtotal: subtotal / 100,
    discount: discount / 100,
    freeShipping,
    shipping: shipping / 100,
    total: (afterDiscount + shipping) / 100,
    saved: (discount + (freeShipping ? 599 : 0)) / 100,
    progress: Math.min(1, afterDiscount / 4900),
  };
}
