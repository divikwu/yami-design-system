import { describe, expect, it } from "vitest";
import { getPreviewMotion } from "../app/lib/motion";

describe("preview motion", () => {
  it("uses enter-only direction and path timings", () => {
    expect(getPreviewMotion("direction", false)).toEqual({ initial: { opacity: 0 }, duration: 0.2 });
    expect(getPreviewMotion("path", false)).toEqual({ initial: { opacity: 0, y: 8 }, duration: 0.3 });
    expect(getPreviewMotion("none", false)).toEqual({ initial: false, duration: 0 });
  });

  it("removes motion when reduced motion is requested", () => {
    expect(getPreviewMotion("direction", true).duration).toBe(0);
    expect(getPreviewMotion("path", true)).toEqual({ initial: { opacity: 0, y: 0 }, duration: 0 });
  });
});
