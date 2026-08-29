import { useState } from "react";
import { Button } from "../Button";
import { Sheet } from "./Sheet";

export function SheetExample() {
  const [open, setOpen] = useState(false);
  return (
    <div lang="zh">
      <Button onClick={() => setOpen(true)}>查看说明</Button>
      <Sheet open={open} title="商品说明" closeLabel="关闭商品说明" onClose={() => setOpen(false)}>
        <p>使用前请阅读商品标签、警示和使用说明。</p>
      </Sheet>
    </div>
  );
}
