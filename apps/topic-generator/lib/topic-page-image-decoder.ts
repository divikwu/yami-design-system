import sharp from "sharp";

import type { TopicPageImageDecoder } from "@yami/topic-generator";

const MIME_BY_FORMAT = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
} as const;

export const topicPageImageDecoder: TopicPageImageDecoder = {
  inspect: async (bytes) => {
    try {
      const image = sharp(bytes, {
        failOn: "error",
        limitInputPixels: 50_000_000,
      });
      const metadata = await image.metadata();
      await image.clone().raw().toBuffer();
      const mimeType = metadata.format
        ? MIME_BY_FORMAT[metadata.format as keyof typeof MIME_BY_FORMAT]
        : undefined;
      return mimeType && metadata.width && metadata.height
        ? { mimeType, width: metadata.width, height: metadata.height }
        : null;
    } catch {
      return null;
    }
  },
};
