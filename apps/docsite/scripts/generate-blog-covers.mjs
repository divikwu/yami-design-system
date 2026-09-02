import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(appRoot, "public/images/blog");

const covers = [
  {
    filename: "storybook-workbench.webp",
    source: path.join(appRoot, "assets/blog-covers/storybook.png"),
  },
  {
    filename: "prototype-architecture.webp",
    source: path.join(appRoot, "assets/blog-covers/prototype.png"),
  },
  {
    filename: "motion-for-react.webp",
    source: path.join(appRoot, "assets/blog-covers/motion.png"),
  },
];

await fs.mkdir(outputDirectory, { recursive: true });

for (const cover of covers) {
  await sharp(cover.source)
    .resize(1600, 900, { fit: "cover" })
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(outputDirectory, cover.filename));
}

console.log(`Generated ${covers.length} Blog covers in ${path.relative(appRoot, outputDirectory)}`);
