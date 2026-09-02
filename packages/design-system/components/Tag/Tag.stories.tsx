import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tag, type TagContext, type TagMode } from "./Tag";

const matchaImage = new URL(
  "../Header/assets/search-suggestions/matcha.png",
  import.meta.url,
).href;

const meta = {
  title: "YAMI/Components/Data Display/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A static responsive pill with M and L sizes, optional leading artwork, independent placement context, light or dark surface mode, and filled or outline treatment.",
      },
    },
  },
  argTypes: {
    context: {
      control: "inline-radio",
      options: ["content", "overlay"],
    },
    mode: {
      control: "inline-radio",
      options: ["light", "dark"],
    },
    size: {
      control: "inline-radio",
      options: ["m", "l"],
    },
    variant: {
      control: "inline-radio",
      options: ["filled", "outline"],
    },
  },
  args: {
    children: "Gentle Daily Formulas",
    context: "content",
    mode: "light",
    size: "m",
    variant: "filled",
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

const showcaseStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-300)",
  width: "min(560px, 100%)",
  fontFamily: "var(--font-family-ios)",
};

const panelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-150)",
  flexWrap: "wrap",
  minHeight: "96px",
  padding: "var(--space-300)",
  borderRadius: "var(--radius-surface-default)",
};

const backgrounds: Record<TagContext, Record<TagMode, string>> = {
  content: {
    light: "var(--color-neutral-50)",
    dark: "var(--color-black-900)",
  },
  overlay: {
    light: "var(--color-neutral-50)",
    dark: "var(--color-black-900)",
  },
};

function Panel({
  label,
  background,
  children,
}: {
  label: string;
  background: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: "var(--space-100)" }}>
      <span
        style={{
          color: "var(--text-secondary)",
          fontSize: "var(--font-size-caption-md)",
        }}
      >
        {label}
      </span>
      <div style={{ ...panelStyle, background }}>{children}</div>
    </div>
  );
}

function Variants({ context, mode }: { context: TagContext; mode: TagMode }) {
  return (
    <div
      data-showcase-context={context}
      data-showcase-mode={mode}
      style={{ display: "flex", gap: "var(--space-150)" }}
    >
      <Tag context={context} mode={mode} variant="filled">
        Filled
      </Tag>
      <Tag context={context} mode={mode} variant="outline">
        Outline
      </Tag>
    </div>
  );
}

function SizesAndImages() {
  return (
    <div
      data-size-showcase
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-150)",
        flexWrap: "wrap",
      }}
    >
      <Tag size="m">M</Tag>
      <Tag size="m" image={{ src: matchaImage, alt: "" }}>
        M · image
      </Tag>
      <Tag size="l">L</Tag>
      <Tag size="l" image={{ src: matchaImage, alt: "" }}>
        L · image
      </Tag>
    </div>
  );
}

export const Showcase: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={showcaseStyle}>
      <Panel
        label="Selected configuration"
        background={backgrounds[args.context][args.mode]}
      >
        <Tag {...args} />
      </Panel>
      <Panel
        label="Responsive sizes · optional image"
        background={backgrounds.content.light}
      >
        <SizesAndImages />
      </Panel>
      <Panel label="Content · light mode" background={backgrounds.content.light}>
        <Variants context="content" mode="light" />
      </Panel>
      <Panel label="Content · dark mode" background={backgrounds.content.dark}>
        <Variants context="content" mode="dark" />
      </Panel>
      <Panel label="Overlay · light mode" background={backgrounds.overlay.light}>
        <Variants context="overlay" mode="light" />
      </Panel>
      <Panel label="Overlay · dark mode" background={backgrounds.overlay.dark}>
        <Variants context="overlay" mode="dark" />
      </Panel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const tags = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        "[data-showcase-context] [data-slot='tag']",
      ),
    );

    if (tags.length !== 8) {
      throw new Error("Tag Showcase must render all eight configurations");
    }

    const isPc = window.matchMedia("(min-width: 1024px)").matches;
    for (const tag of tags) {
      const style = getComputedStyle(tag);
      const expectedHeight = "28px";
      if (style.height !== expectedHeight || style.borderRadius !== "9999px") {
        throw new Error("Tag M must use the responsive full-pill size contract");
      }
    }

    const sizeTags = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        "[data-size-showcase] [data-slot='tag']",
      ),
    );
    if (sizeTags.length !== 4) {
      throw new Error("Tag Showcase must render M and L with and without images");
    }

    for (const tag of sizeTags) {
      const size = tag.dataset.size;
      const expectedHeight =
        size === "l" ? (isPc ? "36px" : "32px") : "28px";
      if (getComputedStyle(tag).height !== expectedHeight) {
        throw new Error(`Tag ${size} must use its responsive height contract`);
      }

      const imageSlot = tag.querySelector<HTMLElement>(
        "[data-slot='tag-image']",
      );
      if (!imageSlot) continue;
      const image = imageSlot.querySelector<HTMLImageElement>("img");
      const slotSize = `${Number.parseInt(expectedHeight, 10) - 4}px`;
      const imageSize = `${Number.parseInt(expectedHeight, 10) - 8}px`;
      if (
        !image ||
        getComputedStyle(imageSlot).width !== slotSize ||
        getComputedStyle(imageSlot).height !== slotSize ||
        getComputedStyle(image).width !== imageSize ||
        getComputedStyle(image).height !== imageSize ||
        getComputedStyle(tag).paddingLeft !== "2px" ||
        getComputedStyle(tag).paddingRight !== "12px"
      ) {
        throw new Error("Image Tags must match the Search image geometry");
      }
    }

    for (const context of ["content", "overlay"] as const) {
      for (const mode of ["light", "dark"] as const) {
        const matches = tags.filter(
          (tag) =>
            tag.dataset.context === context && tag.dataset.mode === mode,
        );
        const filledTag = matches.find(
          (tag) => tag.dataset.variant === "filled",
        );
        const outlineTag = matches.find(
          (tag) => tag.dataset.variant === "outline",
        );

        if (!filledTag || !outlineTag) {
          throw new Error(`Tag Showcase is missing ${context} ${mode}`);
        }

        const expectedFill = {
          content: {
            light: "rgba(0, 0, 0, 0.04)",
            dark: "rgba(255, 255, 255, 0.08)",
          },
          overlay: {
            light: "rgba(0, 0, 0, 0.04)",
            dark: "rgba(255, 255, 255, 0.08)",
          },
        }[context][mode];

        if (getComputedStyle(filledTag).backgroundColor !== expectedFill) {
          throw new Error(`Tag must use the correct ${context} fill`);
        }

        const outlineStyle = getComputedStyle(outlineTag);
        const expectedOutline =
          mode === "light"
            ? "rgba(0, 0, 0, 0.08)"
            : "rgba(255, 255, 255, 0.08)";
        if (
          outlineStyle.backgroundColor !== "rgba(0, 0, 0, 0)" ||
          outlineStyle.borderTopWidth !== "1px" ||
          outlineStyle.borderTopStyle !== "solid" ||
          outlineStyle.borderTopColor !== expectedOutline
        ) {
          throw new Error(
            "Outline Tags must use a transparent surface and subtle stroke",
          );
        }
      }
    }
  },
};

export const Playground: Story = {};
