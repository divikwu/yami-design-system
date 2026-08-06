import type { Meta, StoryObj } from "@storybook/react-vite"

import radiusTokensSource from "./tokens/semantic/radius.tokens.json"
import { TokenHeading, TokenStoryFrame, flattenTokenRecords, formatTokenValue, tokenStoryStyles } from "./token-story"

const meta = {
  title: "YAMI/Foundations/rounded",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI `rounded` variable collection.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const ROUNDED_TOKENS = flattenTokenRecords(radiusTokensSource, "tokens/semantic/radius.tokens.json")

function roundedLabel(token: string) {
  return token.replace(/^--radius-/, "").replaceAll("-", " / ")
}

function RoundedPreview({ token }: { token: string }) {
  const isButton = token.includes("-button-")
  const isTag = token.includes("-tag-")
  const width = isButton ? 160 : isTag ? 112 : 172
  const height = isButton ? 44 : isTag ? 32 : 92

  return (
    <div
      style={{
        alignItems: "center",
        background: "var(--surface-secondary, var(--muted, #f5f5f5))",
        display: "grid",
        minHeight: 120,
        padding: "var(--space-200, 16px)",
        placeItems: "center",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: isButton ? "var(--button-primary, #222)" : "var(--surface-primary, #fff)",
          border: isButton ? "none" : "1px solid var(--border-default, #e5e5e5)",
          borderRadius: `var(${token})`,
          boxShadow: "0 1px 0 rgba(0, 0, 0, 0.04)",
          color: isButton ? "var(--color-white-1000, #fff)" : "var(--text-secondary, #666)",
          display: "grid",
          fontSize: "var(--font-size-caption-md, 12px)",
          height,
          justifyItems: "center",
          maxWidth: "100%",
          outline: "1px solid rgba(0, 0, 0, 0.04)",
          width,
        }}
      >
        {isButton || isTag ? roundedLabel(token) : null}
      </div>
    </div>
  )
}

function RoundedGrid() {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-150, 12px)",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
        maxWidth: 1120,
      }}
    >
      {ROUNDED_TOKENS.map((item) => (
        <article key={item.token} style={tokenStoryStyles.card}>
          <RoundedPreview token={item.token} />
          <div style={tokenStoryStyles.cardBody}>
            <strong style={tokenStoryStyles.tokenName}>{item.sourceLabel}</strong>
            <span style={tokenStoryStyles.caption}>value: {formatTokenValue(item.value)}</span>
            {item.description ? <span style={tokenStoryStyles.caption}>{item.description}</span> : null}
          </div>
        </article>
      ))}
    </div>
  )
}

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame title="rounded" intro="Rounded tokens expose radius slots for surfaces, components, buttons, and tags.">
      <TokenHeading>rounded</TokenHeading>
      <RoundedGrid />
    </TokenStoryFrame>
  ),
}
