import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const result = spawnSync("pnpm", ["exec", "lhci", "autorun", "--config=lighthouserc.json", `--collect.chromePath=${chromium.executablePath()}`], { stdio: "inherit" });
process.exitCode = result.status ?? 1;
