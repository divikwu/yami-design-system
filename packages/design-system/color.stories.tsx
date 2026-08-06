import type { Meta, StoryObj } from "@storybook/react-vite"

import darkSemanticColorTokensSource from "./tokens/themes/dark.tokens.json"
import semanticColorTokensSource from "./tokens/semantic/colors.tokens.json"
import {
  TokenHeading,
  TokenStoryFrame,
  colorGroups,
  colorHasTransparency,
  formatTokenValue,
  tokenStoryKey,
  tokenStoryStyles,
  type ColorToken,
  type ColorTokenGroup,
} from "./token-story"

const meta = {
  title: "YAMI/Foundations/color",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI `color` variable collection rendered from semantic color DTCG tokens.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const LIGHT_SEMANTIC_COLOR_GROUPS = colorGroups(semanticColorTokensSource, "tokens/semantic/colors.tokens.json")
const DARK_SEMANTIC_COLOR_GROUPS = colorGroups(
  darkSemanticColorTokensSource,
  "tokens/themes/dark.tokens.json",
  semanticColorTokensSource,
)

function isInverseForegroundToken(item: ColorToken) {
  const label = item.sourceLabel ?? item.token
  return label.includes("inverse") && label !== "surface.inverse" && label !== "fill.inverse"
}

function isSkeletonToken(item: ColorToken) {
  return (item.sourceLabel ?? item.token).includes("skeleton")
}

function isButtonToken(item: ColorToken) {
  return (item.sourceLabel ?? item.token).startsWith("button.")
}

function isTextToken(item: ColorToken) {
  return (item.sourceLabel ?? item.token).startsWith("text.")
}

function isBorderToken(item: ColorToken) {
  return (item.sourceLabel ?? item.token).startsWith("border.")
}

function isDividerToken(item: ColorToken) {
  return (item.sourceLabel ?? item.token).startsWith("divider.")
}

function isBadgeToken(item: ColorToken) {
  return (item.sourceLabel ?? item.token).startsWith("badge.")
}

function isOverlayToken(item: ColorToken) {
  return (item.sourceLabel ?? item.token).startsWith("overlay.")
}

function semanticColorSwatch(item: ColorToken) {
  return `var(${item.token}, ${typeof item.value === "string" ? item.value : "transparent"})`
}

function cssVarFromSourceLabel(label: string) {
  return `--${label.replaceAll(".", "-")}`
}

function badgePairBackground(label: string) {
  if (label === "badge.fg-default-inverse") {
    return "var(--badge-bg-primary-neutral, var(--surface-inverse, #222))"
  }

  if (label === "badge.fg-default") {
    return "var(--badge-bg-secondary-neutral, var(--surface-secondary, #f5f5f5))"
  }

  const pairedLabel = label.replace("badge.fg-", "badge.bg-")
  return `var(${cssVarFromSourceLabel(pairedLabel)}, var(--surface-secondary, #f5f5f5))`
}

function TextPreview({ item }: { item: ColorToken }) {
  return (
    <strong
      style={{
        color: semanticColorSwatch(item),
        fontSize: "24px",
        fontWeight: "var(--font-weight-emphasize, 600)",
        lineHeight: "32px",
      }}
    >
      Text
    </strong>
  )
}

function SkeletonPreview({ item }: { item: ColorToken }) {
  return (
    <div
      aria-hidden
      style={{
        display: "grid",
        gap: "var(--space-075, 6px)",
        maxWidth: 156,
        width: "72%",
      }}
    >
      {[1, 0.76, 0.52].map((scale, index) => (
        <div
          key={scale}
          style={{
            background: semanticColorSwatch(item),
            borderRadius: "var(--radius-full, 9999px)",
            height: index === 0 ? 14 : 10,
            opacity: index === 0 ? 1 : 0.86,
            width: `${scale * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

function ButtonPreview({ inverse, item }: { inverse: boolean; item: ColorToken }) {
  const label = item.sourceLabel ?? item.token
  const isTertiary = label.includes("tertiary")

  return (
    <div
      aria-hidden
      style={{
        background: semanticColorSwatch(item),
        border: isTertiary ? `1px solid ${inverse ? "rgba(255, 255, 255, 0.32)" : "rgba(0, 0, 0, 0.12)"}` : "none",
        borderRadius: "var(--radius-button-primary, 9999px)",
        boxShadow: inverse ? "0 0 0 1px rgba(255, 255, 255, 0.10)" : "0 1px 0 rgba(0, 0, 0, 0.05)",
        height: 40,
        width: 120,
      }}
    />
  )
}

function BorderPreview({ item }: { item: ColorToken }) {
  return (
    <div
      aria-hidden
      style={{
        border: `2px solid ${semanticColorSwatch(item)}`,
        borderRadius: "var(--radius-component-default, 8px)",
        height: 64,
        width: 64,
      }}
    />
  )
}

function DividerPreview({ item }: { item: ColorToken }) {
  return (
    <div
      aria-hidden
      style={{
        background: semanticColorSwatch(item),
        height: 2,
        width: "86%",
      }}
    />
  )
}

function BadgePreview({ item }: { item: ColorToken }) {
  const label = item.sourceLabel ?? item.token
  const isForegroundToken = label.startsWith("badge.fg-")
  const isInverse = label.includes("inverse")

  return (
    <div
      aria-hidden
      style={{
        alignItems: "center",
        background: isForegroundToken ? badgePairBackground(label) : semanticColorSwatch(item),
        borderRadius: 4,
        color: isForegroundToken ? semanticColorSwatch(item) : undefined,
        display: "flex",
        fontSize: 11,
        fontWeight: "var(--font-weight-emphasize, 600)",
        height: 24,
        justifyContent: "center",
        lineHeight: "16px",
        boxShadow: `inset 0 0 0 1px ${isInverse ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.08)"}`,
        width: 72,
      }}
    >
      {isForegroundToken ? "Badge" : null}
    </div>
  )
}

function InversePreview({ item }: { item: ColorToken }) {
  const label = item.sourceLabel ?? item.token

  if (label.startsWith("brand.")) {
    return (
      <strong
        style={{
          color: semanticColorSwatch(item),
          fontSize: "var(--font-size-display-md, 28px)",
          fontWeight: "var(--font-weight-emphasize, 600)",
          letterSpacing: 0,
          lineHeight: "var(--line-height-display-md, 36px)",
        }}
      >
        YAMI
      </strong>
    )
  }

  if (label.startsWith("text.")) {
    return <TextPreview item={item} />
  }

  if (label.startsWith("button.")) {
    return <ButtonPreview inverse item={item} />
  }

  if (label.startsWith("border.")) {
    return <BorderPreview item={item} />
  }

  if (label.startsWith("divider.")) {
    return <DividerPreview item={item} />
  }

  if (label.startsWith("badge.")) {
    return <BadgePreview item={item} />
  }

  if (label.includes("skeleton")) {
    return <SkeletonPreview item={item} />
  }

  return (
    <div
      style={{
        alignItems: "center",
        border: `1px solid ${semanticColorSwatch(item)}`,
        borderRadius: "var(--radius-component-default, 8px)",
        color: semanticColorSwatch(item),
        display: "grid",
        fontWeight: "var(--font-weight-emphasize, 600)",
        height: 44,
        justifyItems: "center",
        width: 132,
      }}
    >
      inverse
    </div>
  )
}

function SemanticColorCard({ item }: { item: ColorToken }) {
  const swatchValue = item.swatchValue ?? (typeof item.value === "string" ? item.value : undefined)
  const hasTransparentSwatch = colorHasTransparency(swatchValue ?? item.value)
  const inverseForeground = isInverseForegroundToken(item)
  const skeletonToken = isSkeletonToken(item)
  const buttonToken = isButtonToken(item)
  const textToken = isTextToken(item)
  const borderToken = isBorderToken(item)
  const dividerToken = isDividerToken(item)
  const badgeToken = isBadgeToken(item)
  const overlayToken = isOverlayToken(item)
  const showTransparencyGrid = (!inverseForeground && hasTransparentSwatch) || overlayToken
  const checkerboardBackground = [
    "linear-gradient(45deg, #d8d8d8 25%, transparent 25%)",
    "linear-gradient(-45deg, #d8d8d8 25%, transparent 25%)",
    "linear-gradient(45deg, transparent 75%, #d8d8d8 75%)",
    "linear-gradient(-45deg, transparent 75%, #d8d8d8 75%)",
  ].join(", ")

  return (
    <article style={tokenStoryStyles.card}>
      <div
        aria-label={`${item.token} swatch`}
        style={{
          alignContent: "center",
          background: buttonToken
            ? inverseForeground
              ? "var(--surface-inverse, #222)"
              : "var(--surface-secondary, var(--muted, #f5f5f5))"
            : textToken
              ? inverseForeground
                ? "var(--surface-inverse, #222)"
                : "var(--surface-secondary, var(--muted, #f5f5f5))"
            : borderToken
              ? inverseForeground
                ? "var(--surface-inverse, #222)"
                : "var(--surface-secondary, var(--muted, #f5f5f5))"
            : dividerToken
              ? inverseForeground
                ? "var(--surface-inverse, #222)"
                : "var(--surface-secondary, var(--muted, #f5f5f5))"
            : badgeToken
              ? inverseForeground
                ? "var(--surface-inverse, #222)"
                : "var(--surface-secondary, var(--muted, #f5f5f5))"
            : overlayToken
              ? "#fff"
            : inverseForeground
            ? "var(--surface-inverse, #222)"
            : skeletonToken
              ? "var(--surface-secondary, var(--muted, #f5f5f5))"
              : hasTransparentSwatch
                ? "#fff"
                : semanticColorSwatch(item),
          backgroundImage: showTransparencyGrid ? checkerboardBackground : undefined,
          backgroundPosition: showTransparencyGrid ? "0 0, 0 8px, 8px -8px, -8px 0" : undefined,
          backgroundSize: showTransparencyGrid ? "16px 16px" : undefined,
          display: "grid",
          justifyItems: inverseForeground || skeletonToken || buttonToken || textToken || borderToken || dividerToken || badgeToken ? "center" : undefined,
          minHeight: 112,
          overflow: "hidden",
          padding: inverseForeground || skeletonToken || buttonToken || textToken || borderToken || dividerToken || badgeToken ? "var(--space-150, 12px)" : undefined,
          placeItems: inverseForeground || skeletonToken || buttonToken || textToken || borderToken || dividerToken || badgeToken ? "center" : undefined,
          position: "relative",
        }}
      >
        {inverseForeground ? <InversePreview item={item} /> : null}
        {!inverseForeground && textToken ? <TextPreview item={item} /> : null}
        {!inverseForeground && buttonToken ? <ButtonPreview inverse={false} item={item} /> : null}
        {!inverseForeground && borderToken ? <BorderPreview item={item} /> : null}
        {!inverseForeground && dividerToken ? <DividerPreview item={item} /> : null}
        {!inverseForeground && badgeToken ? <BadgePreview item={item} /> : null}
        {!inverseForeground && skeletonToken ? <SkeletonPreview item={item} /> : null}
        {!inverseForeground && (hasTransparentSwatch || overlayToken) ? (
          <div
            aria-hidden
            style={{
              background: semanticColorSwatch(item),
              inset: 0,
              position: "absolute",
            }}
          />
        ) : null}
      </div>
      <div style={tokenStoryStyles.cardBody}>
        <strong style={tokenStoryStyles.tokenName}>{item.sourceLabel ?? item.token}</strong>
        <span style={tokenStoryStyles.caption}>value: {formatTokenValue(item.value)}</span>
        {isInverseForegroundToken(item) ? <span style={tokenStoryStyles.caption}>preview: inverse surface</span> : null}
        {item.description ? <span data-token-description style={tokenStoryStyles.caption}>{item.description}</span> : null}
      </div>
    </article>
  )
}

function SemanticColorGroups({ groups }: { groups: ColorTokenGroup[] }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-200, 16px)" }}>
      {groups.map((group) => (
        <section key={group.label} style={{ display: "grid", gap: "var(--space-100, 8px)" }}>
          <TokenHeading>{group.label}</TokenHeading>
          <div style={tokenStoryStyles.grid}>
            {group.tokens.map((item) => (
              <SemanticColorCard item={item} key={tokenStoryKey(item)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export const Overview: Story = {
  render: (_args, context) => {
    const dark = context.globals.theme === "dark"
    return (
      <TokenStoryFrame
        title="color"
        intro={`Semantic color aliases are rendered from the active YAMI ${dark ? "Dark" : "Light"} source; inverse remains a separate surface polarity.`}
      >
        <TokenHeading>{dark ? "Dark" : "Light"} color</TokenHeading>
        <SemanticColorGroups groups={dark ? DARK_SEMANTIC_COLOR_GROUPS : LIGHT_SEMANTIC_COLOR_GROUPS} />
      </TokenStoryFrame>
    )
  },
  play: async ({ canvasElement }) => {
    const cards = canvasElement.querySelectorAll("article").length
    const descriptions = canvasElement.querySelectorAll("[data-token-description]").length
    if (cards === 0 || descriptions !== cards) {
      throw new Error(`Semantic color descriptions are incomplete: ${descriptions}/${cards}`)
    }
    canvasElement.dataset.colorDescriptionsContract = "passed"
  },
}
