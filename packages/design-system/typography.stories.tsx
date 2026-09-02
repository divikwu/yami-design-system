import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./components/Button/Button"
import { SectionHeading } from "./components/SectionHeading"
import yamiTokensJson from "./generated/tokens.json"
import { TokenHeading, TokenStoryFrame, formatTokenValue, tokenStoryStyles } from "./token-story"

const meta = {
  title: "YAMI/Foundations/typography",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI `typography` variable collection, rendered from local token source references.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

type TokenContext = {
  id: string
  media?: string
  selector?: string
}

type TokenValue = {
  contextId: string
  cssValue: string
}

type TokensJsonToken = {
  cssVar: string
  description?: string
  sourceRef?: {
    path?: string
    pointer?: string
  }
  values: TokenValue[]
}

type TokensJsonDoc = {
  contexts: TokenContext[]
  tokens: TokensJsonToken[]
}

type TypographyProperty = {
  cssVar: string
  description?: string
  sourcePath?: string
  values: TokenValue[]
}

type TypographySpecimen = {
  category: TypographyCategory
  description?: string
  fontSize?: TypographyProperty
  lineHeight?: TypographyProperty
  name: string
}

type TypographyCategory = "display" | "heading" | "body" | "link" | "commerce"

const PREVIEW_COPY = "Bringing All of Asia’s Best to You"
const TOKENS_DOC = yamiTokensJson as TokensJsonDoc
const TYPOGRAPHY_SPECIMENS = typographySpecimens(TOKENS_DOC)
const TYPOGRAPHY_SECTIONS: Array<{ category: TypographyCategory; label: string }> = [
  { category: "display", label: "display" },
  { category: "heading", label: "heading" },
  { category: "body", label: "body & caption" },
  { category: "link", label: "link" },
  { category: "commerce", label: "commerce" },
]
const SERIF_SPECIMEN_NAMES = ["display-xl", "display-md", "display-sm", "heading-md"] as const

function typographySpecimens(doc: TokensJsonDoc): TypographySpecimen[] {
  const specimens = new Map<string, TypographySpecimen>()

  for (const token of doc.tokens) {
    if (!token.sourceRef?.path?.startsWith("tokens/typography/")) continue

    const match = /^\/([^/]+)\/([^/]+)\/\$value$/.exec(token.sourceRef.pointer ?? "")
    if (!match) continue

    const [, name, property] = match
    const specimen = specimens.get(name) ?? {
      category: categoryForName(name),
      name,
    }
    const typographyProperty: TypographyProperty = {
      cssVar: token.cssVar,
      description: token.description,
      sourcePath: token.sourceRef.path,
      values: token.values,
    }

    if (property === "font-size") specimen.fontSize = typographyProperty
    if (property === "line-height") specimen.lineHeight = typographyProperty
    specimen.description ??= token.description
    specimens.set(name, specimen)
  }

  return Array.from(specimens.values())
}

function categoryForName(name: string): TypographyCategory {
  if (name.startsWith("display-")) return "display"
  if (name.startsWith("heading-")) return "heading"
  if (name.startsWith("link-")) return "link"
  if (name.startsWith("price-") || name.startsWith("strike-")) return "commerce"
  return "body"
}

function contextLabel(contextId: string) {
  if (contextId === "root") return "mobile / base"

  const context = TOKENS_DOC.contexts.find((item) => item.id === contextId)
  if (context?.media === "(min-width: 1024px)") return "desktop"
  if (context?.media === "(min-width: 1440px)") return "desktop-lg"
  return context?.media ?? context?.selector ?? contextId
}

function valueForContext(property: TypographyProperty | undefined, contextId: string) {
  return property?.values.find((value) => value.contextId === contextId)?.cssValue
}

function contextRows(specimen: TypographySpecimen) {
  const contextIds = new Set<string>()
  for (const value of specimen.fontSize?.values ?? []) contextIds.add(value.contextId)
  for (const value of specimen.lineHeight?.values ?? []) contextIds.add(value.contextId)
  return Array.from(contextIds)
}

function fallbackValue(property: TypographyProperty | undefined) {
  return property?.values.find((value) => value.contextId === "root")?.cssValue ?? property?.values[0]?.cssValue
}

function specimenWeight(specimen: TypographySpecimen) {
  if (specimen.name.startsWith("heading-") || specimen.name.startsWith("price-")) {
    return "var(--font-weight-emphasize, 500)"
  }

  return "var(--font-weight-normal, 400)"
}

function TypographyGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-150, 12px)",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
        maxWidth: 1120,
        width: "100%",
      }}
    >
      {children}
    </div>
  )
}

function TypographySpecimenCard({
  specimen,
  variant = "sans",
}: {
  specimen: TypographySpecimen
  variant?: "sans" | "serif"
}) {
  const previewFontSize = fallbackValue(specimen.fontSize) ?? "16px"
  const previewLineHeight = fallbackValue(specimen.lineHeight) ?? "24px"
  const isSerif = variant === "serif"
  const styleName = isSerif ? `${specimen.name}-serif` : specimen.name

  return (
    <article style={tokenStoryStyles.card}>
      <div
        style={{
          alignContent: "center",
          background: "var(--surface-secondary, var(--muted, #f5f5f5))",
          display: "grid",
          gap: "var(--space-050, 4px)",
          minHeight: 96,
          padding: "var(--space-200, 16px)",
        }}
      >
        <div
          data-typography-serif={isSerif ? styleName : undefined}
          style={{
            color: "var(--text-primary, var(--foreground, #222))",
            fontFamily: isSerif
              ? "var(--font-family-serif, serif)"
              : "var(--font-family-ios, var(--font-sans, system-ui, sans-serif))",
            fontSize: previewFontSize,
            fontWeight: isSerif
              ? "var(--font-weight-semibold, 600)"
              : specimenWeight(specimen),
            letterSpacing: 0,
            lineHeight: previewLineHeight,
          }}
        >
          {PREVIEW_COPY}
        </div>
        <span style={tokenStoryStyles.caption}>{styleName}</span>
      </div>
      <div style={tokenStoryStyles.cardBody}>
        <strong style={tokenStoryStyles.tokenName}>{styleName}</strong>
        <div
          style={{
            display: "grid",
            gap: "var(--space-050, 4px)",
          }}
        >
          {contextRows(specimen).map((contextId) => (
            <div
              key={contextId}
              style={{
                alignItems: "baseline",
                display: "grid",
                gap: "var(--space-100, 8px)",
                gridTemplateColumns: "92px 1fr",
              }}
            >
              <span style={tokenStoryStyles.caption}>{contextLabel(contextId)}</span>
              <span style={tokenStoryStyles.caption}>
                size {formatTokenValue(valueForContext(specimen.fontSize, contextId) ?? "same")} / line{" "}
                {formatTokenValue(valueForContext(specimen.lineHeight, contextId) ?? "same")}
              </span>
            </div>
          ))}
        </div>
        <span style={tokenStoryStyles.caption}>
          {specimen.fontSize?.cssVar ?? "font-size unavailable"} / {specimen.lineHeight?.cssVar ?? "line-height unavailable"}
        </span>
        {specimen.description ? <span style={tokenStoryStyles.caption}>{specimen.description}</span> : null}
      </div>
    </article>
  )
}

function TypographySerifSection() {
  const specimens = SERIF_SPECIMEN_NAMES.map((name) => TYPOGRAPHY_SPECIMENS.find((item) => item.name === name)).filter(
    (specimen): specimen is TypographySpecimen => specimen !== undefined,
  )

  return (
    <section style={{ display: "grid", gap: "var(--space-100, 8px)" }}>
      <TokenHeading>serif variants</TokenHeading>
      <TypographyGrid>
        {specimens.map((specimen) => (
          <TypographySpecimenCard key={`${specimen.name}-serif`} specimen={specimen} variant="serif" />
        ))}
      </TypographyGrid>
    </section>
  )
}

function TypographySection({ category, label }: { category: TypographyCategory; label: string }) {
  const specimens = TYPOGRAPHY_SPECIMENS.filter((specimen) => specimen.category === category)
  if (specimens.length === 0) return null

  return (
    <section style={{ display: "grid", gap: "var(--space-100, 8px)" }}>
      <TokenHeading>{label}</TokenHeading>
      <TypographyGrid>
        {specimens.map((specimen) => (
          <TypographySpecimenCard key={specimen.name} specimen={specimen} />
        ))}
      </TypographyGrid>
    </section>
  )
}

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame title="typography" intro="Typography foundation tokens are rendered from tokens.json source references.">
      <TypographySerifSection />
      {TYPOGRAPHY_SECTIONS.map((section) => (
        <TypographySection category={section.category} key={section.category} label={section.label} />
      ))}
    </TokenStoryFrame>
  ),
  play: async ({ canvasElement }) => {
    const serifStyles = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-typography-serif]"))
    const expectedStyles = ["display-xl-serif", "display-md-serif", "display-sm-serif", "heading-md-serif"]

    if (serifStyles.map((element) => element.dataset.typographySerif).join(",") !== expectedStyles.join(",")) {
      throw new Error("Typography serif variants must cover display-xl/md/sm and heading-md")
    }

    for (const element of serifStyles) {
      const style = getComputedStyle(element)
      const expectedWeight = "600"
      if (!style.fontFamily.includes("Source Serif 4 Variable") || style.fontWeight !== expectedWeight) {
        throw new Error(`${element.dataset.typographySerif} must use Source Serif 4 Variable ${expectedWeight}`)
      }
    }
  },
}

export const LanguageWeights: Story = {
  name: "Language weights",
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-300)" }}>
      {(["zh-CN", "en-US"] as const).map((lang) => (
        <section key={lang} lang={lang} data-weight-language={lang}>
          <p data-weight="400">{lang === "zh-CN" ? "普通正文" : "Regular text"}</p>
          <strong data-emphasis>{lang === "zh-CN" ? "强调信息" : "Emphasized text"}</strong>
          <b data-emphasis>{lang === "zh-CN" ? "规格选中值" : "Selected option"}</b>
          <Button variant="secondary" data-emphasis>{lang === "zh-CN" ? "查看全部" : "View all"}</Button>
          <span data-emphasis style={{ fontWeight: "var(--fw-bold)" }}>Legacy alias</span>
          <div lang={lang === "zh-CN" ? "en" : "zh"}>
            <strong data-weight={lang === "zh-CN" ? "500" : "600"}>Nested language</strong>
            <span data-weight="400">Regular nested text</span>
          </div>
          <SectionHeading title="20px title" slot="weight-default" />
          <SectionHeading title="Serif title" titleFontFamily="serif" slot="weight-serif" />
          <SectionHeading
            title={<>16px title <span lang="en">Torriden</span><span lang="zh">品牌</span></>}
            mobileTitleSize={16}
            slot="weight-compact"
          />
          <p data-weight="600" style={{ fontFamily: "var(--font-family-serif)", fontWeight: "var(--font-weight-semibold)" }}>Serif 衬线标题</p>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const mobile = window.innerWidth < 1024
    for (const sample of canvasElement.querySelectorAll<HTMLElement>("[data-weight]")) {
      if (getComputedStyle(sample).fontWeight !== sample.dataset.weight) {
        throw new Error(`${sample.textContent} must use weight ${sample.dataset.weight}`)
      }
    }
    for (const section of canvasElement.querySelectorAll<HTMLElement>("[data-weight-language]")) {
      const weight = section.lang.startsWith("zh") ? "600" : "500"
      for (const sample of section.querySelectorAll<HTMLElement>("[data-emphasis]")) {
        if (getComputedStyle(sample).fontWeight !== weight) throw new Error(`${section.lang} emphasis must use ${weight}`)
      }
      const normal = section.querySelector<HTMLElement>('[data-slot="weight-default-title"]')!
      const compact = section.querySelector<HTMLElement>('[data-slot="weight-compact-title"]')!
      const serif = section.querySelector<HTMLElement>('[data-slot="weight-serif-title"]')!
      if (
        getComputedStyle(serif).fontWeight !== "600" ||
        getComputedStyle(normal).fontWeight !== "400" ||
        getComputedStyle(normal).fontSize !== (mobile ? "20px" : "24px") ||
        getComputedStyle(compact).fontWeight !== (mobile ? weight : "400") ||
        getComputedStyle(compact).fontSize !== (mobile ? "16px" : "24px") ||
        getComputedStyle(compact.querySelector('[lang="en"]')!).fontWeight !== (mobile ? "500" : "400") ||
        getComputedStyle(compact.querySelector('[lang="zh"]')!).fontWeight !== (mobile ? "600" : "400")
      ) throw new Error("Shared title sizes must preserve normal and language-aware emphasis weights")
    }
  },
}

export const LanguageWeightsDesktop: Story = {
  ...LanguageWeights,
  name: "Language weights / Desktop",
  globals: { viewport: { value: "yamiDesktopLg", isRotated: false } },
}
