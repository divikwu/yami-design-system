import type { CSSProperties, ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Divider } from "./Divider"

const meta = {
  title: "YAMI/Components/Layout/Divider",
  component: Divider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "YAMI Divider has two strengths: Default is 1px and Emphasis is 2px. Both strengths support inverse rendering on the current theme's opposite-polarity surface.",
      },
    },
  },
  argTypes: {
    strength: {
      control: "select",
      options: ["default", "emphasis"],
    },
    inverse: { control: "boolean" },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
  args: {
    strength: "default",
    inverse: false,
    orientation: "horizontal",
  },
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

const stackStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-250)",
  width: "min(720px, 100%)",
  fontFamily: "var(--font-family-ios)",
}

const surfaceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
  gap: "var(--space-200)",
  alignItems: "stretch",
}

const surfaceStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "var(--space-250)",
  padding: "var(--space-250)",
  background: "var(--surface-primary)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-surface-default)",
}

const inverseSurfaceStyle: CSSProperties = {
  ...surfaceStyle,
  background: "var(--surface-inverse)",
  borderColor: "var(--border-default-inverse)",
}

const labelStyle: CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontSize: "var(--font-size-caption-md)",
  lineHeight: "var(--line-height-caption-md)",
}

const surfaceTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontSize: "var(--font-size-body-md)",
  fontWeight: "var(--font-weight-emphasize)",
  lineHeight: "var(--line-height-body-md)",
}

const specRowStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-100)",
}

const specLabelRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "var(--space-200)",
}

const usageRowStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-150)",
  minHeight: "var(--line-height-body-md)",
  color: "var(--text-primary)",
  fontSize: "var(--font-size-body-md)",
  lineHeight: "var(--line-height-body-md)",
}

function SpecimenSurface({
  title,
  inverse = false,
  children,
}: {
  title: string
  inverse?: boolean
  children: ReactNode
}) {
  return (
    <section style={inverse ? inverseSurfaceStyle : surfaceStyle}>
      <p style={{ ...surfaceTitleStyle, color: inverse ? "var(--text-primary-inverse)" : "var(--text-primary)" }}>
        {title}
      </p>
      {children}
    </section>
  )
}

function DividerSpecRow({
  label,
  thickness,
  strength = "default",
  inverse = false,
}: {
  label: string
  thickness: string
  strength?: "default" | "emphasis"
  inverse?: boolean
}) {
  return (
    <div style={specRowStyle}>
      <div style={specLabelRowStyle}>
        <p style={{ ...labelStyle, color: inverse ? "var(--text-secondary-inverse)" : "var(--text-secondary)" }}>
          {label}
        </p>
        <p style={{ ...labelStyle, color: inverse ? "var(--text-secondary-inverse)" : "var(--text-secondary)" }}>
          {thickness}
        </p>
      </div>
      <Divider strength={strength} inverse={inverse} />
    </div>
  )
}

export const Showcase: Story = {
  render: () => (
    <div style={stackStyle}>
      <div style={surfaceGridStyle}>
        <SpecimenSurface title="Default surface">
          <DividerSpecRow label="Default" thickness="1px" />
          <DividerSpecRow label="Emphasis" thickness="2px" strength="emphasis" />
        </SpecimenSurface>
        <SpecimenSurface title="Inverse surface" inverse>
          <DividerSpecRow label="Default inverse" thickness="1px" inverse />
          <DividerSpecRow label="Emphasis inverse" thickness="2px" strength="emphasis" inverse />
        </SpecimenSurface>
      </div>
      <section style={surfaceStyle}>
        <p style={surfaceTitleStyle}>Vertical usage</p>
        <div style={usageRowStyle}>
          <span>4.8 stars</span>
          <Divider orientation="vertical" />
          <span>1.2k reviews</span>
          <Divider orientation="vertical" />
          <span>Ships free</span>
        </div>
      </section>
    </div>
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div
      style={{
        width: args.orientation === "vertical" ? 120 : 320,
        height: args.orientation === "vertical" ? 80 : undefined,
        background: args.inverse ? "var(--surface-inverse)" : undefined,
        padding: args.inverse ? "var(--space-200)" : undefined,
      }}
    >
      <Divider {...args} />
    </div>
  ),
}
