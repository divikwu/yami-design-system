import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card } from "./Card";

const meta = {
  title: "YAMI/Components/Layout/Card",
  component: Card,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Surface primitive for grouping related content. Borderless by default, token-backed, and polymorphic for static, link, or button cards.",
      },
    },
  },
  args: {
    children: "Card content",
    padding: "md",
    surface: "primary",
    bordered: false,
    interactive: false,
  },
  argTypes: {
    padding: { control: "select", options: ["none", "sm", "md", "lg"] },
    surface: {
      control: "select",
      options: ["primary", "secondary", "inverse"],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const showcaseStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "var(--space-200)",
  width: "min(760px, 100%)",
};

export const Showcase: Story = {
  render: () => (
    <div style={showcaseStyle}>
      <Card>
        <strong>Primary surface</strong>
        <p style={{ marginBottom: 0, color: "var(--text-secondary)" }}>
          Default grouping without a border or shadow.
        </p>
      </Card>
      <Card surface="secondary">
        <strong>Secondary surface</strong>
        <p style={{ marginBottom: 0, color: "var(--text-secondary)" }}>
          Lower visual weight for supporting information.
        </p>
      </Card>
      <Card surface="inverse">
        <strong>Inverse surface</strong>
        <p style={{ marginBottom: 0 }}>Content on the opposite-polarity surface.</p>
      </Card>
      <Card bordered padding="sm">
        <strong>Bordered exception</strong>
        <p style={{ marginBottom: 0, color: "var(--text-secondary)" }}>
          Reserved for dense grids that need separation.
        </p>
      </Card>
    </div>
  ),
};

export const Playground: Story = {};

export const Interactive: Story = {
  args: {
    as: "button",
    children: "Interactive card",
    interactive: undefined,
    type: "button",
  },
};
