import type { TopicPageVisualMimeType } from "../page-visual/contracts.js";

export interface InspectedImage {
  mimeType: TopicPageVisualMimeType;
  width: number;
  height: number;
}

export interface TopicPageImageDecoder {
  inspect(bytes: Uint8Array): Promise<InspectedImage | null>;
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function uint24le(bytes: Uint8Array, offset: number) {
  return bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16);
}

function inspectPng(bytes: Uint8Array): InspectedImage | null {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value) ||
      ascii(bytes, 12, 4) !== "IHDR") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width > 0 && height > 0 ? { mimeType: "image/png", width, height } : null;
}

function inspectJpeg(bytes: Uint8Array): InspectedImage | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1]!;
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    if (length < 2 || offset + 2 + length > bytes.length) return null;
    if (sofMarkers.has(marker)) {
      const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!;
      const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!;
      return width > 0 && height > 0 ? { mimeType: "image/jpeg", width, height } : null;
    }
    offset += 2 + length;
  }
  return null;
}

function inspectWebp(bytes: Uint8Array): InspectedImage | null {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
    return null;
  }
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8X") {
    return {
      mimeType: "image/webp",
      width: uint24le(bytes, 24) + 1,
      height: uint24le(bytes, 27) + 1,
    };
  }
  if (chunk === "VP8L" && bytes[20] === 0x2f) {
    const width = 1 + (bytes[21]! | ((bytes[22]! & 0x3f) << 8));
    const height = 1 + ((bytes[22]! >> 6) | (bytes[23]! << 2) | ((bytes[24]! & 0x0f) << 10));
    return { mimeType: "image/webp", width, height };
  }
  if (chunk === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    const width = (bytes[26]! | (bytes[27]! << 8)) & 0x3fff;
    const height = (bytes[28]! | (bytes[29]! << 8)) & 0x3fff;
    return width > 0 && height > 0 ? { mimeType: "image/webp", width, height } : null;
  }
  return null;
}

export function inspectImageBytes(bytes: Uint8Array): InspectedImage | null {
  return inspectPng(bytes) ?? inspectJpeg(bytes) ?? inspectWebp(bytes);
}
