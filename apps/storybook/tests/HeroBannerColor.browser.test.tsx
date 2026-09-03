import { expect, test } from "vitest";

import { extractImageBottomColor } from "../../../packages/design-system/components/HeroBanner/imageColor";

test("samples the actual bottom edge independently of responsive image density", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 540;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "rgb(240, 210, 210)";
  context.fillRect(0, 0, 480, 540);
  context.fillStyle = "rgb(160, 200, 240)";
  context.fillRect(0, 470, 480, 70);
  const src = canvas.toDataURL();

  for (const width of [400, 422, 480]) {
    const image = new Image();
    image.sizes = `${width}px`;
    image.srcset = `${src} 480w`;
    image.src = src;
    await image.decode();
    expect(image.naturalWidth).toBe(width);
    // Separate cache keys ensure every density is sampled rather than reused.
    expect(await extractImageBottomColor(`${src}#${width}`, image)).toBe(
      "rgb(160, 200, 240)",
    );
  }
});
