import type { Meta, StoryObj } from "@storybook/react-vite"

import radiusTokensSource from "./tokens/primitives/radius.tokens.json"
import spacingTokensSource from "./tokens/primitives/spacing.tokens.json"
import strokeTokensSource from "./tokens/primitives/stroke.tokens.json"
import { TokenHeading, TokenStoryFrame, flattenTokenRecords, formatTokenValue, tokenStoryStyles } from "./token-story"

const meta = {
  title: "YAMI/Primitives/size-primitives",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI `size-primitives` variable collection.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const SIZE_PRIMITIVE_TOKENS = [
  ...flattenTokenRecords(spacingTokensSource, "tokens/primitives/spacing.tokens.json"),
  ...flattenTokenRecords(strokeTokensSource, "tokens/primitives/stroke.tokens.json"),
  ...flattenTokenRecords(radiusTokensSource, "tokens/primitives/radius.tokens.json"),
]

const SPACE_TOKENS = sortByDimension(SIZE_PRIMITIVE_TOKENS.filter((token) => token.sourceLabel?.startsWith("space.")))
const STROKE_TOKENS = sortByDimension(SIZE_PRIMITIVE_TOKENS.filter((token) => token.sourceLabel?.startsWith("stroke.")))
const RADIUS_TOKENS = sortByDimension(SIZE_PRIMITIVE_TOKENS.filter((token) => token.sourceLabel?.startsWith("radius.")))

function dimensionToPx(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value !== "string") return 0
  const match = /^([0-9.]+)(px)?$/.exec(value)
  return match ? Number.parseFloat(match[1]!) : 0
}

function sortByDimension<T extends { value: unknown; sourceLabel?: string }>(tokens: T[]) {
  return [...tokens].sort((a, b) => {
    const valueDiff = dimensionToPx(a.value) - dimensionToPx(b.value)
    if (valueDiff !== 0) return valueDiff
    return (a.sourceLabel ?? "").localeCompare(b.sourceLabel ?? "")
  })
}

function SizeSection({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section style={{ display: "grid", gap: "var(--space-100, 8px)" }}>
      <TokenHeading>{title}</TokenHeading>
      {children}
    </section>
  )
}

function SizeGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-150, 12px)",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 220px))",
        justifyContent: "start",
      }}
    >
      {children}
    </div>
  )
}

function SizeCard({
  children,
  description,
  label,
  value,
}: {
  children: React.ReactNode
  description?: string
  label: string
  value: unknown
}) {
  return (
    <article style={tokenStoryStyles.card}>
      <div
        style={{
          alignItems: "center",
          background: "var(--surface-secondary, var(--muted, #f5f5f5))",
          display: "flex",
          justifyContent: "center",
          minHeight: 88,
          padding: "var(--space-150, 12px)",
        }}
      >
        {children}
      </div>
      <div style={tokenStoryStyles.cardBody}>
        <strong style={tokenStoryStyles.tokenName}>{label}</strong>
        <span style={tokenStoryStyles.caption}>value: {formatTokenValue(value)}</span>
        {description ? <span style={tokenStoryStyles.caption}>{description}</span> : null}
      </div>
    </article>
  )
}

function SpacePreview({ value }: { value: unknown }) {
  const px = dimensionToPx(value)
  const width = Math.max(px, px === 0 ? 2 : 4)

  return (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--space-100, 8px)", width: "100%" }}>
      <div
        style={{
          background: "var(--fill-info-primary, #3b82f6)",
          borderRadius: "var(--radius-sm, 4px)",
          height: 16,
          width,
        }}
      />
      <span style={tokenStoryStyles.caption}>{formatTokenValue(value)}</span>
    </div>
  )
}

function StrokePreview({ value }: { value: unknown }) {
  const px = dimensionToPx(value)

  return (
    <div style={{ display: "grid", gap: "var(--space-100, 8px)", width: "100%" }}>
      <div
        style={{
          borderTop: `${Math.max(px, 1)}px solid var(--text-primary, var(--foreground, #222))`,
          opacity: px === 0 ? 0.2 : 1,
          width: "100%",
        }}
      />
      <span style={tokenStoryStyles.caption}>{px === 0 ? "no stroke" : formatTokenValue(value)}</span>
    </div>
  )
}

function RadiusPreview({ value }: { value: unknown }) {
  const px = dimensionToPx(value)
  const radius = px >= 100 ? 999 : px

  return (
    <div
      style={{
        background: "var(--surface-primary, var(--card, #fff))",
        border: "1px solid var(--border-default, var(--border, #e5e5e5))",
        borderRadius: radius,
        height: 56,
        width: 88,
      }}
    />
  )
}

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame
      title="size-primitives"
      intro="Size primitive tokens use an 8px-centered scale with smaller 2px and 4px steps for compact control interiors."
    >
      <SizeSection title="space">
        <SizeGrid>
          {SPACE_TOKENS.map((token) => (
            <SizeCard description={token.description} key={token.sourceLabel} label={token.sourceLabel ?? token.token} value={token.value}>
              <SpacePreview value={token.value} />
            </SizeCard>
          ))}
        </SizeGrid>
      </SizeSection>
      <SizeSection title="stroke">
        <SizeGrid>
          {STROKE_TOKENS.map((token) => (
            <SizeCard key={token.sourceLabel} label={token.sourceLabel ?? token.token} value={token.value}>
              <StrokePreview value={token.value} />
            </SizeCard>
          ))}
        </SizeGrid>
      </SizeSection>
      <SizeSection title="radius">
        <SizeGrid>
          {RADIUS_TOKENS.map((token) => (
            <SizeCard description={token.description} key={token.sourceLabel} label={token.sourceLabel ?? token.token} value={token.value}>
              <RadiusPreview value={token.value} />
            </SizeCard>
          ))}
        </SizeGrid>
      </SizeSection>
    </TokenStoryFrame>
  ),
}
