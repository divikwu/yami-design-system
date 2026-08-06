import type { Meta, StoryObj } from "@storybook/react-vite"

import iconsMetaSource from "./assets/icons/icons.meta.json"
import { TokenStoryFrame, tokenStoryStyles } from "./token-story"

type IconModule = string | { default?: unknown; src?: unknown }

const iconModules = import.meta.glob("./assets/icons/**/*.svg", {
  eager: true,
  query: "?raw",
}) as Record<string, IconModule>

const meta = {
  title: "YAMI/Assets/Icons",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI icon assets rendered from design-systems/yami/assets/icons and icons.meta.json.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

type IconMeta = {
  name: string
  category: string
  path: string
  width: number
  height: number
  sha1: string
}

type IconsMeta = {
  version: string
  generatedAt?: string
  canvases: number[]
  categories: Record<string, { count: number; canvas: number }>
  icons: IconMeta[]
}

const iconsMeta = iconsMetaSource as IconsMeta
const sourceRoot = "design-systems/yami/assets/icons"

function toImportKey(path: string) {
  return `./${path}`
}

function iconSvg(icon: IconMeta) {
  return resolveIconModuleValue(iconModules[toImportKey(icon.path)])
}

function resolveIconModuleValue(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return undefined

  const record = value as IconModule
  if (typeof record.src === "string") return record.src
  return resolveIconModuleValue(record.default)
}

function formatCategoryLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const categoryNames = Object.keys(iconsMeta.categories)

function IconsSummary() {
  const iconCount = iconsMeta.icons.length
  const canvasLabel = iconsMeta.canvases.map((canvas) => `${canvas}px`).join(", ")

  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-150, 12px)",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
        maxWidth: 960,
      }}
    >
      <SummaryItem label="Icons" value={String(iconCount)} />
      <SummaryItem label="Categories" value={String(categoryNames.length)} />
      <SummaryItem label="Canvases" value={canvasLabel} />
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

function IconCategory({ category }: { category: string }) {
  const categoryMeta = iconsMeta.categories[category]
  const icons = iconsMeta.icons.filter((icon) => icon.category === category)

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
          {formatCategoryLabel(category)}
        </h2>
        <p style={tokenStoryStyles.description}>
          {categoryMeta?.count ?? icons.length} icons on a {categoryMeta?.canvas ?? icons[0]?.width ?? 24}px canvas.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gap: "var(--space-150, 12px)",
          gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
        }}
      >
        {icons.map((icon) => (
          <IconCard key={`${icon.category}/${icon.name}`} icon={icon} />
        ))}
      </div>
    </section>
  )
}

function IconCard({ icon }: { icon: IconMeta }) {
  const svg = iconSvg(icon)
  const isInlineSvg = svg?.trimStart().startsWith("<svg") ?? false

  return (
    <article style={tokenStoryStyles.card}>
      <div
        style={{
          alignItems: "center",
          background: "var(--surface-secondary, #f5f5f5)",
          display: "grid",
          justifyItems: "center",
          minHeight: 96,
          padding: "var(--space-200, 16px)",
        }}
      >
        {svg && isInlineSvg ? (
          <span
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: svg }}
            style={{
              color: "var(--text-primary, #222)",
              display: "grid",
              height: 40,
              placeItems: "center",
              width: 40,
            }}
          />
        ) : svg ? (
          <img
            alt=""
            src={svg}
            style={{
              display: "block",
              height: icon.height,
              maxHeight: 40,
              maxWidth: 40,
              width: icon.width,
            }}
          />
        ) : (
          <span style={tokenStoryStyles.caption}>Missing SVG</span>
        )}
      </div>
      <div style={tokenStoryStyles.cardBody}>
        <strong style={tokenStoryStyles.tokenName}>{icon.name}</strong>
        <span style={tokenStoryStyles.caption}>{icon.path}</span>
        <span style={tokenStoryStyles.caption}>
          {icon.width}x{icon.height} - {icon.sha1}
        </span>
      </div>
    </article>
  )
}

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame
      title="Icons"
      intro="The YAMI icon set is indexed from the local SVG assets and metadata."
    >
      <IconsSummary />
      {categoryNames.map((category) => (
        <IconCategory key={category} category={category} />
      ))}
    </TokenStoryFrame>
  ),
}
