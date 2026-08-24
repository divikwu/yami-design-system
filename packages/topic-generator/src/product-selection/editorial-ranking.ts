import type { YamiProduct } from "../types.js";

type EditorialProduct = Pick<
  YamiProduct,
  "id" | "imageUrl" | "productUrl" | "sourceRank" | "weeklySalesLabel"
>;

function catalogUrlIdentity(value: string) {
  const normalized = value.trim();
  if (!/^https?:\/\//i.test(normalized)) return null;
  return normalized.split(/[?#]/, 1)[0]!.toLocaleLowerCase();
}

function weeklySalesLowerBound(product: EditorialProduct) {
  const quantity = product.weeklySalesLabel?.match(/[\d,]+/)?.[0];
  if (!quantity) return -1;
  const value = Number(quantity.replaceAll(",", ""));
  return Number.isFinite(value) ? value : -1;
}

export function distinctEditorialProducts<T extends EditorialProduct>(
  products: readonly T[],
) {
  const seenImages = new Set<string>();
  const seenProducts = new Set<string>();
  return products.filter((product) => {
    const imageIdentity = catalogUrlIdentity(product.imageUrl);
    const productIdentity = catalogUrlIdentity(product.productUrl);
    if (
      (imageIdentity && seenImages.has(imageIdentity)) ||
      (productIdentity && seenProducts.has(productIdentity))
    ) return false;
    if (imageIdentity) seenImages.add(imageIdentity);
    if (productIdentity) seenProducts.add(productIdentity);
    return true;
  });
}

export function rankDistinctEditorialProducts<T extends EditorialProduct>(
  products: readonly T[],
  maximumProducts: number,
) {
  return distinctEditorialProducts([...products]
    .sort((left, right) =>
      weeklySalesLowerBound(right) - weeklySalesLowerBound(left) ||
      left.sourceRank - right.sourceRank
    ))
    .slice(0, maximumProducts);
}
