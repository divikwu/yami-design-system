import { ProductCard } from "../../components/ProductCard";

export function ProductResult() {
  return (
    <ProductCard
      href="/products/matcha"
      title="Uji matcha"
      priceCurrent="$12.99"
      onAddToCart={() => undefined}
    />
  );
}
