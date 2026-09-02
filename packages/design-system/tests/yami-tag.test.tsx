import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Tag,
  type TagContext,
  type TagSize,
  type TagMode,
  type TagVariant,
} from "../components/Tag";

describe("YAMI Tag", () => {
  it("defaults to a light-mode filled treatment in content", () => {
    const markup = renderToStaticMarkup(<Tag>Botanical</Tag>);

    expect(markup).toContain('data-context="content"');
    expect(markup).toContain('data-mode="light"');
    expect(markup).toContain('data-size="m"');
    expect(markup).toContain('data-variant="filled"');
  });

  it("supports content and overlay contexts across both modes and variants", () => {
    const contexts: TagContext[] = ["content", "overlay"];
    const modes: TagMode[] = ["dark", "light"];
    const variants: TagVariant[] = ["filled", "outline"];

    for (const context of contexts) {
      for (const mode of modes) {
        for (const variant of variants) {
          const markup = renderToStaticMarkup(
            <Tag context={context} mode={mode} variant={variant}>
              Botanical
            </Tag>,
          );

          expect(markup).toContain(`data-context="${context}"`);
          expect(markup).toContain(`data-mode="${mode}"`);
          expect(markup).toContain(`data-variant="${variant}"`);
        }
      }
    }
  });

  it("supports both responsive sizes", () => {
    const sizes: TagSize[] = ["m", "l"];

    for (const size of sizes) {
      const markup = renderToStaticMarkup(<Tag size={size}>Botanical</Tag>);
      expect(markup).toContain(`data-size="${size}"`);
    }
  });

  it("supports optional decorative artwork before the label", () => {
    const markup = renderToStaticMarkup(
      <Tag image={{ src: "/matcha.png", alt: "" }} size="l">
        Matcha
      </Tag>,
    );

    expect(markup).toContain('data-has-image="true"');
    expect(markup).toContain('data-slot="tag-image"');
    expect(markup).toContain('src="/matcha.png"');
    expect(markup).toContain('alt=""');
  });
});
