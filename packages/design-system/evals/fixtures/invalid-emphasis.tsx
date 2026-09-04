import { Button } from "../../components/Button";

export function ConflictingActions() {
  return (
    <main>
      <Button variant="emphasis">Buy now</Button>
      <Button variant="emphasis">Add to cart</Button>
    </main>
  );
}
