import { useState } from "react";
import { Button } from "../Button";
import { Dialog } from "./Dialog";

export function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <div lang="zh">
      <Button onClick={() => setOpen(true)}>确认操作</Button>
      <Dialog open={open} title="确认操作" variant="confirmation" onClose={() => setOpen(false)}>
        <p>应用后，当前设置将立即生效。</p>
      </Dialog>
    </div>
  );
}
