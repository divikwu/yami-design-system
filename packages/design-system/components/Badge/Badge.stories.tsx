import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge, type BadgeType } from "./Badge"

const meta = {
  title: "YAMI/Components/Data Display/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "YAMI Badge — mirrors Figma `Badge / Mobile` + `Badge / PC` (file 6oOAy72DBff4P6NzJYc2hi). Abstract color × emphasis, plus a `type` shortcut that maps to Figma's named Type variants (sale / new / hot / discount / etc.).",
      },
    },
  },
  argTypes: {
    color: {
      control: "select",
      options: ["red", "blue", "green", "purple", "yellow", "neutral"],
    },
    emphasis: { control: "select", options: ["primary", "secondary"] },
    type: {
      control: "select",
      options: [
        undefined,
        "price",
        "sale",
        "low-price",
        "discount",
        "new",
        "hot",
        "exclusive",
        "choice",
        "best-sellers",
      ],
    },
  },
  args: {
    children: "New",
    color: "neutral",
    emphasis: "primary",
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

const COLORS = ["red", "blue", "green", "purple", "yellow", "neutral"] as const
const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const TYPES: { type: BadgeType; label: string }[] = [
  { type: "sale", label: "Sale" },
  { type: "low-price", label: "Low Price" },
  { type: "discount", label: "-30%" },
  { type: "new", label: "New" },
  { type: "hot", label: "Hot" },
  { type: "exclusive", label: "Exclusive" },
  { type: "choice", label: "Choice" },
  { type: "best-sellers", label: "Best Sellers" },
  { type: "price", label: "$9.99" },
]

const stackStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-400)",
  maxWidth: 480,
  width: "100%",
  fontFamily: "var(--font-family-ios)",
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-150)",
  alignItems: "center",
}

const rowLabelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-caption-sm)",
  color: "var(--text-secondary)",
  marginBottom: "var(--space-100)",
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={rowLabelStyle}>{label}</div>
      <div style={rowStyle}>{children}</div>
    </div>
  )
}

// ───────────────────────────── Stories ─────────────────────────────

export const Showcase: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={stackStyle}>
      <Row label="Color (emphasis=primary)">
        {COLORS.map((c) => (
          <Badge key={c} color={c}>
            {toTitleCase(c)}
          </Badge>
        ))}
      </Row>

      <Row label="Color (emphasis=secondary)">
        {COLORS.map((c) => (
          <Badge key={c} color={c} emphasis="secondary" style={{ color: "var(--text-primary)" }}>
            {toTitleCase(c)}
          </Badge>
        ))}
      </Row>

      <Row label="Type (Figma semantic shortcuts)">
        {TYPES.map(({ type, label }) => (
          <Badge key={type} type={type}>
            {label}
          </Badge>
        ))}
      </Row>

      <Row label="Flag prefix (exclusive / choice — auto-rendered, bilingual)">
        <Badge type="exclusive">Exclusive</Badge>
        <Badge type="choice">Choice</Badge>
        <Badge type="exclusive">独家</Badge>
        <Badge type="choice">精选</Badge>
      </Row>
    </div>
  ),
}

/** Interactive playground — drive every prop via the Controls panel. */
export const Playground: Story = {}

/** Sale — most common promotion badge (red tinted). */
export const Sale: Story = {
  args: { type: "sale", children: "Sale" },
}

/** New — purple-tinted "just launched" badge. */
export const New: Story = {
  args: { type: "new", children: "New" },
}

/** Hot — purple-tinted trending badge. */
export const Hot: Story = {
  args: { type: "hot", children: "Hot" },
}

/** Discount — red-tinted percentage discount badge. */
export const Discount: Story = {
  args: { type: "discount", children: "-30% OFF" },
}

/** Best Sellers — yellow-tinted top-product badge. */
export const BestSellers: Story = {
  args: { type: "best-sellers", children: "Best Sellers" },
}

/** Solid primary — full-bleed background for max attention. */
export const SolidPrimary: Story = {
  args: { color: "red", emphasis: "primary", children: "Urgent" },
}

/** Override — explicit color/emphasis wins over the type preset. */
export const TypeWithOverride: Story = {
  args: { type: "sale", color: "green", children: "Sold (overridden)" },
}
