import type { Meta, StoryObj } from "@storybook/react-vite"

import typographyPrimitiveTokensSource from "./tokens/primitives/typography.tokens.json"
import { TokenHeading, TokenStoryFrame, asRecord, tokenStoryStyles } from "./token-story"

const meta = {
  title: "YAMI/Primitives/typography-primitives",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI `typography-primitives` variable collection, rendered from local DTCG tokens.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

type TypographyPrimitiveToken = {
  description?: string
  label: string
  value: Record<string, unknown>
}

const TYPOGRAPHY_SOURCE = typographyPrimitiveTokensSource
const FONT_WEIGHT_TOKENS = tokensForGroup("font-weight")
const FONT_FAMILY_TOKENS = tokensForGroup("font-family")
const LETTER_SPACING_TOKENS = tokensForGroup("letter-spacing")
const PREVIEW_COPY = "Bringing All of Asia’s Best to You"

function tokensForGroup(groupName: string): TypographyPrimitiveToken[] {
  const group = asRecord(asRecord(TYPOGRAPHY_SOURCE)?.[groupName])
  if (!group) return []

  return Object.entries(group)
    .filter(([key]) => !key.startsWith("$"))
    .map(([key, token]) => {
      const record = asRecord(token)
      const value = asRecord(record?.$value) ?? {}
      const description = record?.$description

      return {
        description: typeof description === "string" ? description : undefined,
        label: `${groupName}.${key}`,
        value,
      }
    })
}

function valueLabel(value: Record<string, unknown>) {
  return Object.entries(value)
    .map(([locale, localeValue]) => `${locale}: ${String(localeValue)}`)
    .join(" / ")
}

function fontWeightValue(value: unknown) {
  if (value === "SemiBold") return 600
  if (value === "Medium") return 500
  if (value === "Regular") return 400
  if (typeof value === "number") return value
  return 400
}

function letterSpacingValue(value: unknown) {
  if (typeof value === "number") return `${value}px`
  if (typeof value === "string") return value.endsWith("px") ? value : `${value}px`
  return "0px"
}

function TypographyGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-150, 12px)",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
        justifyContent: "start",
        maxWidth: 1120,
        width: "100%",
      }}
    >
      {children}
    </div>
  )
}

function TypographyCard({
  children,
  description,
  label,
  value,
}: {
  children: React.ReactNode
  description?: string
  label: string
  value: Record<string, unknown>
}) {
  return (
    <article style={tokenStoryStyles.card}>
      <div
        style={{
          background: "var(--surface-secondary, var(--muted, #f5f5f5))",
          minHeight: 112,
          padding: "var(--space-150, 12px)",
        }}
      >
        {children}
      </div>
      <div style={tokenStoryStyles.cardBody}>
        <strong style={tokenStoryStyles.tokenName}>{label}</strong>
        <span style={tokenStoryStyles.caption}>value: {valueLabel(value)}</span>
        {description ? <span style={tokenStoryStyles.caption}>{description}</span> : null}
      </div>
    </article>
  )
}

function WeightPreview({ token }: { token: TypographyPrimitiveToken }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-050, 4px)" }}>
      {(["EN", "CN"] as const).map((language) => (
      <div
        key={language}
        lang={language === "EN" ? "en" : "zh"}
        style={{
          color: "var(--text-primary, var(--foreground, #222))",
          fontSize: 24,
          fontWeight: fontWeightValue(token.value[language]),
          lineHeight: "30px",
        }}
      >
        {language === "EN" ? PREVIEW_COPY : "亚米精选，汇聚亚洲好物"}
      </div>
      ))}
      <span style={tokenStoryStyles.caption}>EN {String(token.value.EN)} / CN {String(token.value.CN)}</span>
    </div>
  )
}

function FontFamilyPreview({ token }: { token: TypographyPrimitiveToken }) {
  const fontFamily = `"${String(token.value.EN)}", "${String(token.value.CN)}", system-ui, sans-serif`

  return (
    <div style={{ display: "grid", gap: "var(--space-050, 4px)" }}>
      <div
        style={{
          color: "var(--text-primary, var(--foreground, #222))",
          fontFamily,
          fontSize: 24,
          fontWeight: 500,
          lineHeight: "30px",
        }}
      >
        {PREVIEW_COPY}
      </div>
      <span style={tokenStoryStyles.caption}>EN {String(token.value.EN)}</span>
      <span style={tokenStoryStyles.caption}>CN {String(token.value.CN)}</span>
    </div>
  )
}

function LetterSpacingPreview({ token }: { token: TypographyPrimitiveToken }) {
  const letterSpacing = letterSpacingValue(token.value.EN)

  return (
    <div style={{ display: "grid", gap: "var(--space-050, 4px)" }}>
      <div
        style={{
          color: "var(--text-primary, var(--foreground, #222))",
          fontSize: 24,
          fontWeight: 500,
          letterSpacing,
          lineHeight: "30px",
        }}
      >
        {PREVIEW_COPY}
      </div>
      <div
        style={{
          color: "var(--text-secondary, var(--muted-foreground, #666))",
          fontSize: 16,
          letterSpacing: letterSpacingValue(token.value.CN),
          lineHeight: "22px",
        }}
      >
        {PREVIEW_COPY}
      </div>
    </div>
  )
}

function TypographySection({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section style={{ display: "grid", gap: "var(--space-100, 8px)" }}>
      <TokenHeading>{title}</TokenHeading>
      <TypographyGrid>{children}</TypographyGrid>
    </section>
  )
}

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame title="typography-primitives" intro="Typography primitive tokens are rendered from local DTCG source.">
      <TypographySection title="font-weight">
        {FONT_WEIGHT_TOKENS.map((token) => (
          <TypographyCard description={token.description} key={token.label} label={token.label} value={token.value}>
            <WeightPreview token={token} />
          </TypographyCard>
        ))}
      </TypographySection>
      <TypographySection title="font-family">
        {FONT_FAMILY_TOKENS.map((token) => (
          <TypographyCard description={token.description} key={token.label} label={token.label} value={token.value}>
            <FontFamilyPreview token={token} />
          </TypographyCard>
        ))}
      </TypographySection>
      <TypographySection title="letter-spacing">
        {LETTER_SPACING_TOKENS.map((token) => (
          <TypographyCard description={token.description} key={token.label} label={token.label} value={token.value}>
            <LetterSpacingPreview token={token} />
          </TypographyCard>
        ))}
      </TypographySection>
    </TokenStoryFrame>
  ),
}
