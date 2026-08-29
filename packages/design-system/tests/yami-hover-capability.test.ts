import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const componentsRoot = join(process.cwd(), "components");

function cssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

function findUnguardedHover(path: string): string[] {
  const css = readFileSync(path, "utf8");
  const stack: string[] = [];
  const violations: string[] = [];
  let buffer = "";
  let line = 1;
  let quote = "";
  let inComment = false;

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    if (character === "\n") line += 1;

    if (inComment) {
      if (css.startsWith("*/", index)) {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (css.startsWith("/*", index)) {
      inComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (css.startsWith(":hover", index)) {
      const guarded = stack.some((header) => (
        header.startsWith("@media")
        && header.includes("(hover: hover)")
        && header.includes("(pointer: fine)")
      ));
      if (!guarded) violations.push(`${path}:${line}`);
      buffer += ":hover";
      index += 5;
      continue;
    }
    if (character === "{") {
      stack.push(buffer.trim());
      buffer = "";
    } else if (character === "}") {
      stack.pop();
      buffer = "";
    } else if (character === ";") {
      buffer = "";
    } else {
      buffer += character;
    }
  }

  return violations;
}

describe("hover capability", () => {
  it("guards every component hover state behind hover and fine-pointer support", () => {
    const violations = cssFiles(componentsRoot).flatMap(findUnguardedHover);
    expect(violations).toEqual([]);
  });
});
