import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tag } from "./Tag";

const meta = {
  title: "YAMI/Components/Data Display/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A static 28px pill for short descriptive keywords, with translucent filled and transparent 1px-outline treatments for opposite-polarity backgrounds.",
      },
    },
  },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["dark", "light", "dark-outline", "light-outline"],
    },
  },
  args: {
    children: "Gentle Daily Formulas",
    tone: "dark",
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
  minHeight: "96px",
  padding: "var(--space-300)",
  borderRadius: "var(--radius-surface-default)",
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

export const Showcase: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={showcaseStyle}>
      <Panel
        label="Dark translucent tone · light or mixed background"
        background="var(--surface-secondary)"
      >
        <Tag tone="dark">Heartleaf Botanical</Tag>
      </Panel>
      <Panel
        label="Light translucent tone · dark background"
        background="var(--color-black-900)"
      >
        <Tag tone="light">Targeted Active Care</Tag>
      </Panel>
      <Panel
        label="Dark 1px outline · light background"
        background="var(--surface-primary)"
      >
        <Tag tone="dark-outline">Gentle Daily Formulas</Tag>
      </Panel>
      <Panel
        label="Light 1px outline · dark background"
        background="var(--color-black-900)"
      >
        <Tag tone="light-outline">Barrier Support</Tag>
      </Panel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const tags = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="tag"]'),
    );
    const darkTag = tags.find((tag) => tag.dataset.tone === "dark");
    const lightTag = tags.find((tag) => tag.dataset.tone === "light");
    const darkOutlineTag = tags.find(
      (tag) => tag.dataset.tone === "dark-outline",
    );
    const lightOutlineTag = tags.find(
      (tag) => tag.dataset.tone === "light-outline",
    );

    if (!darkTag || !lightTag || !darkOutlineTag || !lightOutlineTag) {
      throw new Error("Tag Showcase must render all four tones");
    }

    for (const tag of tags) {
      const style = getComputedStyle(tag);
      if (style.height !== "28px" || style.borderRadius !== "9999px") {
        throw new Error("Tag must use the 28px full-pill size contract");
      }
    }

    if (
      getComputedStyle(darkTag).backgroundColor !== "rgba(0, 0, 0, 0.55)" ||
      getComputedStyle(lightTag).backgroundColor !==
        "rgba(255, 255, 255, 0.68)"
    ) {
      throw new Error("Tag tones must retain their token-backed transparency");
    }

    for (const tag of [darkOutlineTag, lightOutlineTag]) {
      const style = getComputedStyle(tag);
      if (
        style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
        style.borderTopWidth !== "1px" ||
        style.borderTopStyle !== "solid" ||
        style.borderTopColor !== style.color
      ) {
        throw new Error(
          "Outline Tag tones must use a transparent surface and 1px currentColor stroke",
        );
      }
    }
  },
};

export const Playground: Story = {};
