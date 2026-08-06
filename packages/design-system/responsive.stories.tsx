import type { Meta, StoryObj } from "@storybook/react-vite"

import breakpointTokensSource from "./tokens/primitives/breakpoints.tokens.json"
import { TokenHeading, TokenStoryFrame, flattenTokenRecords, formatTokenValue, tokenStoryStyles } from "./token-story"

const meta = {
  title: "YAMI/Foundations/responsive",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI `responsive` variable collection.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const RESPONSIVE_TOKENS = flattenTokenRecords(breakpointTokensSource, "tokens/primitives/breakpoints.tokens.json")
const MAX_BREAKPOINT = Math.max(...RESPONSIVE_TOKENS.map((item) => numericPx(item.value)), 1)

function numericPx(value: unknown) {
  if (typeof value !== "string") return 0
  const match = /^([0-9.]+)px$/.exec(value)
  return match ? Number(match[1]) : 0
}

function ResponsiveScale() {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-200, 16px)",
        maxWidth: 1120,
      }}
    >
      <div
        style={{
          background: "var(--surface-secondary, var(--muted, #f5f5f5))",
          border: "1px solid var(--border-default, #e5e5e5)",
          borderRadius: "var(--radius-surface-default, 12px)",
          display: "grid",
          gap: "var(--space-100, 8px)",
          padding: "var(--space-200, 16px)",
        }}
      >
        <div
          aria-hidden
          style={{
            background: "linear-gradient(90deg, var(--border-default, #e5e5e5), var(--text-primary, #222))",
            borderRadius: "var(--radius-full, 9999px)",
            height: 6,
          }}
        />
        <div
          style={{
            display: "grid",
            gap: "var(--space-100, 8px)",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          }}
        >
          {RESPONSIVE_TOKENS.map((item) => (
            <div key={item.token} style={{ display: "grid", gap: 2 }}>
              <strong style={tokenStoryStyles.tokenName}>{item.sourceLabel?.replace("breakpoints.", "")}</strong>
              <span style={tokenStoryStyles.caption}>{formatTokenValue(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gap: "var(--space-150, 12px)",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        }}
      >
        {RESPONSIVE_TOKENS.map((item) => {
          const value = numericPx(item.value)
          const percent = Math.max(12, (value / MAX_BREAKPOINT) * 100)

          return (
            <article key={item.token} style={tokenStoryStyles.card}>
              <div
                style={{
                  alignContent: "center",
                  background: "var(--surface-secondary, var(--muted, #f5f5f5))",
                  display: "grid",
                  gap: "var(--space-075, 6px)",
                  minHeight: 96,
                  padding: "var(--space-200, 16px)",
                }}
              >
                <div
                  aria-label={`${item.token} width preview`}
                  style={{
                    background: "var(--brand-primary, #f00)",
                    borderRadius: "var(--radius-full, 9999px)",
                    height: 10,
                    width: `${percent}%`,
                  }}
                />
                <span style={tokenStoryStyles.caption}>{formatTokenValue(item.value)} viewport minimum</span>
              </div>
              <div style={tokenStoryStyles.cardBody}>
                <strong style={tokenStoryStyles.tokenName}>{item.sourceLabel}</strong>
                <span style={tokenStoryStyles.caption}>value: {formatTokenValue(item.value)}</span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame title="responsive" intro="Responsive tokens are rendered from the breakpoint token source.">
      <TokenHeading>responsive</TokenHeading>
      <ResponsiveScale />
    </TokenStoryFrame>
  ),
}
