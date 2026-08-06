import type { Meta, StoryObj } from "@storybook/react-vite"

import { TokenStoryFrame, tokenStoryStyles } from "./token-story"

type LogoModule = string | { default?: unknown; src?: unknown }

const logoModules = import.meta.glob("./assets/logos/*.svg", {
  eager: true,
  query: "?raw",
}) as Record<string, LogoModule>

const meta = {
  title: "YAMI/Assets/Logos",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "YAMI brand marks rendered from design-systems/yami/assets/logos. Exported from Figma `YAMI-UI-UX-Guidelines` — brand mark node `2279:2811` / `2279:2819`, UI lockup node `2013:13691`.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

type LogoEntry = {
  file: string
  width: number
  height: number
  style: "fill" | "line" | "fill-inverse"
  lang?: "CN" | "EN"
  platform?: "Mobile" | "PC"
}

type LogoSet = {
  id: string
  title: string
  description: string
  /** White-wordmark lockups need a dark stage or they read as a mark alone. */
  onDark?: boolean
  logos: LogoEntry[]
}

const sourceRoot = "design-systems/yami/assets/logos"

const logoSets: LogoSet[] = [
  {
    id: "logo-icon",
    title: "Brand Mark",
    description:
      "Standalone Y monogram on a 64px canvas. yami-icon-fill.svg is canonical — it backs design-system.meta.json#/assets/logo.",
    logos: [
      { file: "yami-icon-fill.svg", width: 64, height: 64, style: "fill" },
      { file: "yami-icon-line.svg", width: 64, height: 64, style: "line" },
    ],
  },
  {
    id: "logo-ui",
    title: "UI Lockup",
    description:
      "Mark + wordmark for App / Web headers. Icon is 32px tall on Mobile, 52px on PC. Pick one language per surface — never mix CN and EN.",
    logos: [
      { file: "yami-ui-cn-mobile-fill.svg", width: 126, height: 32, style: "fill", lang: "CN", platform: "Mobile" },
      { file: "yami-ui-cn-mobile-line.svg", width: 126, height: 32, style: "line", lang: "CN", platform: "Mobile" },
      { file: "yami-ui-cn-pc-fill.svg", width: 164, height: 52, style: "fill", lang: "CN", platform: "PC" },
      { file: "yami-ui-cn-pc-line.svg", width: 164, height: 52, style: "line", lang: "CN", platform: "PC" },
      { file: "yami-ui-en-mobile-fill.svg", width: 84, height: 32, style: "fill", lang: "EN", platform: "Mobile" },
      { file: "yami-ui-en-mobile-line.svg", width: 84, height: 32, style: "line", lang: "EN", platform: "Mobile" },
      { file: "yami-ui-en-pc-fill.svg", width: 124, height: 52, style: "fill", lang: "EN", platform: "PC" },
      { file: "yami-ui-en-pc-line.svg", width: 124, height: 52, style: "line", lang: "EN", platform: "PC" },
    ],
  },
  {
    id: "logo-ui-inverse",
    title: "UI Lockup — Dark Surfaces",
    onDark: true,
    description:
      "Fill paints its wordmark #222222, which vanishes on a dark band. These are the same locked lockup with a white wordmark and a brand-red mark — swap the whole file, never rebuild the lockup from mark + wordmark to recolour the text. No Figma variant yet; the logo-ui set has no lightness axis.",
    logos: [
      { file: "yami-ui-cn-mobile-fill-inverse.svg", width: 126, height: 32, style: "fill-inverse", lang: "CN", platform: "Mobile" },
      { file: "yami-ui-cn-pc-fill-inverse.svg", width: 164, height: 52, style: "fill-inverse", lang: "CN", platform: "PC" },
      { file: "yami-ui-en-mobile-fill-inverse.svg", width: 84, height: 32, style: "fill-inverse", lang: "EN", platform: "Mobile" },
      { file: "yami-ui-en-pc-fill-inverse.svg", width: 124, height: 52, style: "fill-inverse", lang: "EN", platform: "PC" },
    ],
  },
]

function resolveLogoModuleValue(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return undefined

  const record = value as LogoModule
  if (typeof record.src === "string") return record.src
  return resolveLogoModuleValue(record.default)
}

function logoSvg(file: string) {
  return resolveLogoModuleValue(logoModules[`./assets/logos/${file}`])
}

const STYLE_LABELS: Record<LogoEntry["style"], string> = {
  fill: "Fill",
  line: "Line",
  "fill-inverse": "Fill · Inverse",
}

function variantLabel(logo: LogoEntry) {
  return [logo.lang, logo.platform, STYLE_LABELS[logo.style]].filter(Boolean).join(" · ")
}

function LogosSummary() {
  const logoCount = logoSets.reduce((total, set) => total + set.logos.length, 0)

  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-150, 12px)",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
        maxWidth: 960,
      }}
    >
      <SummaryItem label="Logos" value={String(logoCount)} />
      <SummaryItem label="Sets" value={String(logoSets.length)} />
      <SummaryItem label="Brand red" value="--color-brand-red" />
      <SummaryItem label="Source" value={sourceRoot} />
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        ...tokenStoryStyles.card,
        display: "grid",
        gap: "var(--space-050, 4px)",
        padding: "var(--space-150, 12px)",
      }}
    >
      <span style={tokenStoryStyles.caption}>{label}</span>
      <strong style={tokenStoryStyles.tokenName}>{value}</strong>
    </div>
  )
}

function LogoSetSection({ set }: { set: LogoSet }) {
  return (
    <section style={tokenStoryStyles.section}>
      <div>
        <h2
          style={{
            ...tokenStoryStyles.title,
            fontSize: "var(--font-size-title-md, 20px)",
            lineHeight: "var(--line-height-title-md, 28px)",
          }}
        >
          {set.title}
        </h2>
        <p style={tokenStoryStyles.description}>{set.description}</p>
      </div>
      <div
        style={{
          display: "grid",
          gap: "var(--space-150, 12px)",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        }}
      >
        {set.logos.map((logo) => (
          <LogoCard key={logo.file} logo={logo} onDark={set.onDark} />
        ))}
      </div>
    </section>
  )
}

function LogoCard({ logo, onDark }: { logo: LogoEntry; onDark?: boolean }) {
  const svg = logoSvg(logo.file)
  const isInlineSvg = svg?.trimStart().startsWith("<svg") ?? false

  return (
    <article style={tokenStoryStyles.card}>
      <div
        style={{
          alignItems: "center",
          // The dark stage is pinned to the neutral primitive, not
          // --surface-inverse: that token flips to white under .dark, which
          // would hide the very wordmark this set exists to prove readable.
          background: onDark
            ? "var(--color-neutral-900, #222)"
            : "var(--surface-secondary, #f5f5f5)",
          display: "grid",
          justifyItems: "center",
          minHeight: 112,
          padding: "var(--space-200, 16px)",
        }}
      >
        {svg && isInlineSvg ? (
          <span
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: svg }}
            style={{ display: "grid", placeItems: "center" }}
          />
        ) : svg ? (
          <img alt="" src={svg} style={{ display: "block", height: logo.height, width: logo.width }} />
        ) : (
          <span style={tokenStoryStyles.caption}>Missing SVG</span>
        )}
      </div>
      <div style={tokenStoryStyles.cardBody}>
        <strong style={tokenStoryStyles.tokenName}>{logo.file.replace(/\.svg$/, "")}</strong>
        <span style={tokenStoryStyles.caption}>{variantLabel(logo)}</span>
        <span style={tokenStoryStyles.caption}>
          {logo.width}x{logo.height}
        </span>
      </div>
    </article>
  )
}

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame
      assetLabel="Brand Assets"
      title="Logos"
      intro="YAMI brand marks, indexed from the local SVG assets exported from Figma."
    >
      <LogosSummary />
      {logoSets.map((set) => (
        <LogoSetSection key={set.id} set={set} />
      ))}
    </TokenStoryFrame>
  ),
}
