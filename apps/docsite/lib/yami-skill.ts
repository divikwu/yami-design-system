import fs from "node:fs";
import path from "node:path";

import type { Locale } from "./locales";

export function readYamiSkill(locale: Locale = "en"): string {
  const filename = locale === "zh" ? "SKILL.zh-CN.md" : "SKILL.md";
  return fs.readFileSync(path.join(process.cwd(), "../../packages/design-system", filename), "utf8");
}
