import { describe, expect, it } from "vitest";

import { topicPageImageDecoder } from "./topic-page-image-decoder";

const PNG_8_BY_6 = new Uint8Array(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQI12NgZGLGihgGUgIAVJYBIVMJHGwAAAAASUVORK5CYII=",
  "base64",
));

describe("Topic Page sharp image decoder", () => {
  it("returns MIME and dimensions only when the complete image can be decoded", async () => {
    await expect(topicPageImageDecoder.inspect(PNG_8_BY_6)).resolves.toEqual({
      mimeType: "image/png",
      width: 8,
      height: 6,
    });
    await expect(topicPageImageDecoder.inspect(PNG_8_BY_6.slice(0, 24))).resolves.toBeNull();
  });
});
