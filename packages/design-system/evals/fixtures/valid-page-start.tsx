import { Button } from "../../components/Button";
import { ProductList } from "../../components/ProductList";

export function MaintainedPageStart() {
  return (
    <main>
      <ProductList title="Featured products" products={[]} />
      <Button variant="primary">View all</Button>
    </main>
  );
}
