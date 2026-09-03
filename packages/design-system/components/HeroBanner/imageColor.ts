interface ColorBucket {
  count: number;
  red: number;
  green: number;
  blue: number;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export interface HeroBannerPalette {
  foreground: "dark" | "light";
  surfaceColor?: string;
}

const LIGHT_FOREGROUND_LUMINANCE_CUTOFF = 0.25;
const MAX_WHITE_TEXT_SURFACE_LUMINANCE = 1.05 / 4.5 - 0.05;
const imageBottomColorCache = new Map<string, Promise<string | undefined>>();

function parseColor(value: string): RgbColor | undefined {
  const hex = value.match(/^#([\da-f]{6})$/i)?.[1];
  if (hex) {
    return {
      red: Number.parseInt(hex.slice(0, 2), 16),
      green: Number.parseInt(hex.slice(2, 4), 16),
      blue: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  const channels = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!channels) return undefined;
  return {
    red: Number(channels[1]),
    green: Number(channels[2]),
    blue: Number(channels[3]),
  };
}

function relativeLuminance({ red, green, blue }: RgbColor): number {
  const linearize = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)
  );
}

function darkenForWhiteText(color: RgbColor): RgbColor {
  let lower = 0;
  let upper = 1;

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const factor = (lower + upper) / 2;
    const candidate = {
      red: color.red * factor,
      green: color.green * factor,
      blue: color.blue * factor,
    };
    if (relativeLuminance(candidate) <= MAX_WHITE_TEXT_SURFACE_LUMINANCE) {
      lower = factor;
    } else {
      upper = factor;
    }
  }

  return {
    red: Math.floor(color.red * lower),
    green: Math.floor(color.green * lower),
    blue: Math.floor(color.blue * lower),
  };
}

export function heroBannerPalette(
  backgroundColor?: string,
): HeroBannerPalette {
  if (!backgroundColor) return { foreground: "dark" };
  const color = parseColor(backgroundColor);
  if (!color) {
    return { foreground: "dark", surfaceColor: backgroundColor };
  }
  if (relativeLuminance(color) > LIGHT_FOREGROUND_LUMINANCE_CUTOFF) {
    return { foreground: "dark", surfaceColor: backgroundColor };
  }

  const surface =
    relativeLuminance(color) <= MAX_WHITE_TEXT_SURFACE_LUMINANCE
      ? color
      : darkenForWhiteText(color);
  return {
    foreground: "light",
    surfaceColor: `rgb(${surface.red}, ${surface.green}, ${surface.blue})`,
  };
}

export function dominantColorFromPixels(
  pixels: Uint8ClampedArray,
): string | undefined {
  const buckets = new Map<number, ColorBucket>();

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;
    if (alpha < 128) continue;

    const red = pixels[index] ?? 0;
    const green = pixels[index + 1] ?? 0;
    const blue = pixels[index + 2] ?? 0;
    const key = (red >> 5) << 6 | (green >> 5) << 3 | (blue >> 5);
    const bucket = buckets.get(key) ?? {
      count: 0,
      red: 0,
      green: 0,
      blue: 0,
    };

    bucket.count += 1;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
  }

  const dominant = Array.from(buckets.values()).reduce<ColorBucket | undefined>(
    (current, candidate) =>
      !current || candidate.count > current.count ? candidate : current,
    undefined,
  );

  if (!dominant) return undefined;

  return `rgb(${Math.round(dominant.red / dominant.count)}, ${Math.round(
    dominant.green / dominant.count,
  )}, ${Math.round(dominant.blue / dominant.count)})`;
}

async function sampleImageBottomColor(
  src: string,
  sourceImage?: HTMLImageElement,
): Promise<string | undefined> {
  const image = sourceImage ?? new Image();
  const loaded =
    sourceImage && sourceImage.complete && sourceImage.naturalWidth > 0
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          if (sourceImage) {
            sourceImage.addEventListener("load", () => resolve(), {
              once: true,
            });
            sourceImage.addEventListener(
              "error",
              () => reject(new Error("Unable to sample campaign image")),
              { once: true },
            );
            return;
          }

          image.onload = () => resolve();
          image.onerror = () =>
            reject(new Error("Unable to sample campaign image"));
        });

  if (!sourceImage) {
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = src;
  }

  let bitmap: ImageBitmap | undefined;
  try {
    await loaded;
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 8;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || image.naturalWidth === 0 || image.naturalHeight === 0) {
      return undefined;
    }

    // srcset density-corrects naturalWidth/Height; crop decoded pixels instead
    // so responsive layout cannot move the sampled strip into the artwork.
    bitmap = await createImageBitmap(image);
    const sourceHeight = Math.max(1, Math.round(bitmap.height * 0.12));
    context.drawImage(
      bitmap,
      0,
      bitmap.height - sourceHeight,
      bitmap.width,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return dominantColorFromPixels(
      context.getImageData(0, 0, canvas.width, canvas.height).data,
    );
  } catch {
    return undefined;
  } finally {
    bitmap?.close();
  }
}

export function extractImageBottomColor(
  src: string,
  sourceImage?: HTMLImageElement,
): Promise<string | undefined> {
  if (!src || typeof document === "undefined" || typeof Image === "undefined") {
    return Promise.resolve(undefined);
  }

  const cached = imageBottomColorCache.get(src);
  if (cached) return cached;

  const sampled = sampleImageBottomColor(src, sourceImage);
  imageBottomColorCache.set(src, sampled);
  return sampled;
}
