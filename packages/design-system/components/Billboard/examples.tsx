import { Billboard } from "./Billboard";
import { createBillboardProps } from "./fixtures";

export function BillboardExample() {
  return <Billboard {...createBillboardProps("zh", "/campaigns/new-user")} />;
}
