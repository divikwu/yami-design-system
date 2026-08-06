import type { Meta, StoryObj } from "@storybook/react-vite"

import layoutTokensSource from "./tokens/primitives/layout.tokens.json"
import spacingTokensSource from "./tokens/primitives/spacing.tokens.json"
import { TokenHeading, TokenStoryFrame, flattenTokenRecords, formatTokenValue, tokenStoryStyles } from "./token-story"

const meta = {
  title: "YAMI/Foundations/layout",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI `layout` variable collection.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const LAYOUT_TOKENS = flattenTokenRecords(layoutTokensSource, "tokens/primitives/layout.tokens.json")

type LayoutSource = {
  layout?: Record<
    string,
    {
      $description?: string
      $extensions?: {
        "com.yami.breakpoints"?: Record<string, unknown>
      }
      $value?: unknown
    }
  >
}

type SpacingSource = {
  space?: Record<string, { $value?: unknown }>
}

const LAYOUT_SOURCE = layoutTokensSource as LayoutSource
const SPACING_SOURCE = spacingTokensSource as SpacingSource

function sourceKey(sourceLabel: string | undefined) {
  return sourceLabel?.replace(/^layout\./, "") ?? ""
}

function resolveDimension(value: unknown) {
  if (typeof value !== "string") return undefined

  const alias = /^\{space\.([^}]+)\}$/.exec(value)
  if (alias) {
    const resolved = SPACING_SOURCE.space?.[alias[1]!]?.$value
    return typeof resolved === "string" ? resolved : undefined
  }

  return value
}

function LayoutPreview({
  baseValue,
  desktopValue,
}: {
  baseValue?: string
  desktopValue?: string
}) {
  return (
    <div
      style={{
        background: "var(--surface-secondary, var(--muted, #f5f5f5))",
        display: "grid",
        gap: "var(--space-150, 12px)",
        padding: "var(--space-200, 16px)",
      }}
    >
      {[
        { label: "base", margin: baseValue },
        { label: "desktop", margin: desktopValue ?? baseValue },
      ].map((item) => (
        <div key={item.label} style={{ display: "grid", gap: "var(--space-050, 4px)" }}>
          <span style={tokenStoryStyles.caption}>{item.label}</span>
          <div
            style={{
              background: "var(--surface-primary, #fff)",
              border: "1px solid var(--border-default, #e5e5e5)",
              borderRadius: "var(--radius-component-default, 8px)",
              paddingInline: item.margin,
              paddingBlock: "var(--space-075, 6px)",
            }}
          >
            <div
              style={{
                background: "var(--brand-primary, #f00)",
                borderRadius: "var(--radius-full, 9999px)",
                height: 10,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function LayoutGrid() {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-150, 12px)",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
        maxWidth: 960,
      }}
    >
      {LAYOUT_TOKENS.map((item) => {
        const key = sourceKey(item.sourceLabel)
        const source = LAYOUT_SOURCE.layout?.[key]
        const desktopValue = source?.$extensions?.["com.yami.breakpoints"]?.desktop
        const baseResolved = resolveDimension(item.value)
        const desktopResolved = resolveDimension(desktopValue)

        return (
          <article key={item.token} style={tokenStoryStyles.card}>
            <LayoutPreview baseValue={baseResolved} desktopValue={desktopResolved} />
            <div style={tokenStoryStyles.cardBody}>
              <strong style={tokenStoryStyles.tokenName}>{item.sourceLabel}</strong>
              <span style={tokenStoryStyles.caption}>
                base: {formatTokenValue(item.value)}
                {baseResolved ? ` (${baseResolved})` : ""}
              </span>
              {desktopValue ? (
                <span style={tokenStoryStyles.caption}>
                  desktop: {formatTokenValue(desktopValue)}
                  {desktopResolved ? ` (${desktopResolved})` : ""}
                </span>
              ) : null}
              {item.description ? <span style={tokenStoryStyles.caption}>{item.description}</span> : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame title="layout" intro="Layout tokens are rendered from the layout token source.">
      <TokenHeading>layout</TokenHeading>
      <LayoutGrid />
    </TokenStoryFrame>
  ),
}
