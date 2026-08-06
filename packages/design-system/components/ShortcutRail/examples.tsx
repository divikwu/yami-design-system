import { ShortcutRail } from "./ShortcutRail";
import { createShortcutItems } from "./fixtures";

export function ShortcutRailExample() {
  return (
    <ShortcutRail
      items={createShortcutItems("zh")}
      ariaLabel="精选快捷入口"
    />
  );
}
