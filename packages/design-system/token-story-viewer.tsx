type CSSProperties = Record<string, number | string | undefined>
type ReactNode = React.ReactNode

export const tokenStoryStyles = {
  surface: {
    minHeight: "100vh",
    padding: "var(--space-300, 24px)",
    background: "var(--background-primary, var(--background, #fff))",
    color: "var(--text-primary, var(--foreground, #222))",
    fontFamily: "var(--font-family-ios, var(--font-sans, system-ui, sans-serif))",
  },
  eyebrow: {
    margin: 0,
    color: "var(--text-emphasis, var(--primary, #222))",
    fontFamily: "var(--font-family-ios, var(--font-sans, system-ui, sans-serif))",
    fontSize: "var(--font-size-caption-md, 12px)",
    lineHeight: "var(--line-height-caption-md, 18px)",
    fontWeight: "var(--font-weight-emphasize, 600)",
    letterSpacing: 0,
  },
  title: {
    margin: "var(--space-050, 4px) 0 0",
    fontFamily: "var(--font-family-ios, var(--font-sans, system-ui, sans-serif))",
    fontSize: "var(--font-size-display-md, 28px)",
    lineHeight: "var(--line-height-display-md, 36px)",
    fontWeight: "var(--font-weight-emphasize, 600)",
    letterSpacing: 0,
  },
  description: {
    maxWidth: 720,
    margin: "var(--space-100, 8px) 0 0",
    color: "var(--text-secondary, var(--muted-foreground, #666))",
    fontSize: "var(--font-size-body-md, 14px)",
    lineHeight: "var(--line-height-body-md, 22px)",
  },
  section: {
    display: "grid",
    gap: "var(--space-150, 12px)",
    marginTop: "var(--space-300, 24px)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 220px))",
    gap: "var(--space-150, 12px)",
    justifyContent: "start",
  },
  card: {
    overflow: "hidden",
    border: "1px solid var(--border-default, var(--border, #e5e5e5))",
    borderRadius: "var(--radius-surface-default, var(--radius-md, 8px))",
    background: "var(--surface-primary, var(--card, #fff))",
  },
  cardBody: {
    display: "grid",
    gap: "var(--space-050, 4px)",
    padding: "var(--space-150, 12px)",
  },
  tokenName: {
    color: "var(--text-primary, var(--foreground, #222))",
    fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
    fontSize: 13,
    lineHeight: "20px",
    overflowWrap: "anywhere" as const,
  },
  caption: {
    color: "var(--text-secondary, var(--muted-foreground, #666))",
    fontSize: "var(--font-size-caption-md, 12px)",
    lineHeight: "var(--line-height-caption-md, 18px)",
    overflowWrap: "anywhere" as const,
  },
} satisfies Record<string, CSSProperties>

export type TokenStoryItem = {
  token: string
  editable?: boolean
  sourcePath: string
  value: unknown
  aliasOf?: string
  context?: string
  description?: string
  foreground?: string
  pointer?: string
  sourceKind?: "source" | "alias"
  sourceLabel?: string
  swatchValue?: string
}

export type TokenStoryGroup = {
  label: string
  tokens: TokenStoryItem[]
}

export type TokenRecord = TokenStoryItem
export type ColorToken = TokenStoryItem
export type ColorTokenGroup = TokenStoryGroup
export type MeasureToken = {
  token: string
  label: string
  value: string
}

export type ColorTokenOptions = {
  descriptionSource?: unknown
  foreground?: string
  sourceFile?: string
}

export type DesignTokensJsonDoc = {
  brandId: string
  contexts: Array<{ id: string; selector?: string; media?: string }>
  tokens: Array<{
    id: string
    name: string
    cssVar: string
    type: string
    group?: string
    description?: string
    sourceRef?: { path?: string; pointer?: string }
    values: Array<{
      contextId: string
      rawValue: unknown
      cssValue: string
      resolvedValue?: string
      aliasOf?: string
      sourceRef?: { path?: string; pointer?: string }
    }>
  }>
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function formatTokenValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

export function cssVariableName(path: readonly string[]): string {
  return `--${path.join("-")}`
}

export function pointerForPath(path: readonly string[], field = "$value"): string {
  return `/${[...path, field].map((part) => part.replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`
}

export function colorForeground(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value)
  if (!match) return undefined
  const alpha = match[2] ? Number.parseInt(match[2], 16) / 255 : 1
  if (alpha < 0.5) return undefined
  const hex = match[1]!
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return luminance < 0.55 ? "--color-white-1000" : undefined
}

export function colorHasTransparency(value: unknown): boolean {
  if (typeof value !== "string") return false

  const shortHex = /^#(?:[0-9a-f]{3})([0-9a-f])$/i.exec(value)
  if (shortHex) return Number.parseInt(shortHex[1]!, 16) < 15

  const longHex = /^#(?:[0-9a-f]{6})([0-9a-f]{2})$/i.exec(value)
  if (longHex) return Number.parseInt(longHex[1]!, 16) < 255

  const rgba = /^rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\s*\)$/i.exec(value)
  if (rgba) return Number.parseFloat(rgba[1]!) < 1

  return false
}

export function getTokenNode(source: unknown, path: readonly string[]): Record<string, unknown> | null {
  let cursor: unknown = source

  for (const segment of path) {
    const record = asRecord(cursor)
    if (!record || !(segment in record)) return null
    cursor = record[segment]
  }

  return asRecord(cursor)
}

export function getTokenDescription(source: unknown, path: readonly string[]): string | undefined {
  const description = getTokenNode(source, path)?.$description
  return typeof description === "string" && description.length > 0 ? description : undefined
}

export function getTokenValue(source: unknown, path: readonly string[]): unknown {
  return getTokenNode(source, path)?.$value
}

export function colorToken(
  source: unknown,
  path: readonly string[],
  token = cssVariableName(path),
  options: ColorTokenOptions = {},
): ColorToken {
  const value = getTokenValue(source, path)

  return {
    token,
    sourcePath: options.sourceFile ?? path.join("."),
    value,
    description: getTokenDescription(options.descriptionSource ?? source, path),
    foreground: options.foreground ?? colorForeground(value),
    pointer: pointerForPath(path),
    sourceLabel: path.join("."),
  }
}

export function primitiveColorGroups(source: unknown, sourceFile = "tokens/primitives/colors.tokens.json"): ColorTokenGroup[] {
  const colorRoot = asRecord(asRecord(source)?.color)
  if (!colorRoot) return []

  return Object.entries(colorRoot).flatMap(([groupName, groupValue]) => {
    const group = asRecord(groupValue)
    if (!group) return []
    return [
      {
        label: groupName,
        tokens: Object.keys(group).map((tokenName) =>
          colorToken(source, ["color", groupName, tokenName], cssVariableName(["color", groupName, tokenName]), {
            sourceFile,
          }),
        ),
      },
    ]
  })
}

export function colorGroups(
  source: unknown,
  sourceFile = "tokens/semantic/colors.tokens.json",
  descriptionSource: unknown = source,
): ColorTokenGroup[] {
  const root = asRecord(source)
  if (!root) return []

  return Object.entries(root).flatMap(([groupName, groupValue]) => {
    if (groupName.startsWith("$")) return []
    const group = asRecord(groupValue)
    if (!group) return []
    return [
      {
        label: groupName,
        tokens: Object.keys(group)
          .filter((tokenName) => !tokenName.startsWith("$"))
          .map((tokenName) => colorToken(source, [groupName, tokenName], cssVariableName([groupName, tokenName]), {
            descriptionSource,
            sourceFile,
          })),
      },
    ]
  })
}

export function flattenTokenRecords(source: unknown, sourceFile = "tokens.json"): TokenRecord[] {
  const records: TokenRecord[] = []

  function visit(node: unknown, path: string[]) {
    const record = asRecord(node)
    if (!record) return

    if ("$value" in record) {
      const description = record.$description
      const value = record.$value

      records.push({
        token: cssVariableName(path),
        sourcePath: sourceFile,
        sourceLabel: path.join("."),
        pointer: pointerForPath(path),
        value,
        description: typeof description === "string" && description.length > 0 ? description : undefined,
        foreground: colorForeground(value),
      })
      return
    }

    for (const [key, value] of Object.entries(record)) {
      if (key.startsWith("$")) continue
      visit(value, [...path, key])
    }
  }

  visit(source, [])
  return records
}

export function groupTokenRecords(records: readonly TokenRecord[]): TokenStoryGroup[] {
  const groups = new Map<string, TokenRecord[]>()

  for (const record of records) {
    const label = record.sourceLabel?.split(".")[0] ?? record.token.replace(/^--/, "").split("-")[0] ?? "tokens"
    groups.set(label, [...(groups.get(label) ?? []), record])
  }

  return Array.from(groups, ([label, tokens]) => ({ label, tokens }))
}

export function tokensFromTokensJson(
  doc: DesignTokensJsonDoc,
  filter: (token: DesignTokensJsonDoc["tokens"][number]) => boolean,
): TokenRecord[] {
  const contexts = new Map(doc.contexts.map((context) => [context.id, context.selector ?? context.media ?? context.id]))

  return doc.tokens.filter(filter).flatMap((token) =>
    token.values.map((value) => {
      const isAlias = token.sourceRef?.pointer === "@theme inline" || Boolean(value.aliasOf)

      return {
        token: token.cssVar,
        editable: !isAlias,
        sourcePath: token.sourceRef?.path ?? "tokens.json",
        sourceLabel: token.name,
        pointer: token.sourceRef?.pointer,
        context: contexts.get(value.contextId) ?? value.contextId,
        value: value.cssValue,
        aliasOf: value.aliasOf,
        description: token.description,
        foreground: colorForeground(value.resolvedValue ?? value.cssValue),
        sourceKind: isAlias ? "alias" : "source",
        swatchValue: value.resolvedValue ?? value.cssValue,
      }
    }),
  )
}

export function normalizeSourcePath(sourcePath: string, assetId: string): string {
  if (sourcePath.startsWith("repo://")) return sourcePath.slice("repo://".length)
  if (assetId === "yami" && sourcePath.startsWith("tokens/")) return `design-systems/yami/${sourcePath}`
  return sourcePath
}

export function tokenStoryKey(item: TokenStoryItem): string {
  return [item.sourcePath, item.token, item.pointer ?? "no-pointer", item.context ?? "default"].join("|")
}

export function TokenStoryFrame({
  assetLabel = "Design Tokens",
  children,
  intro,
  title,
}: {
  assetLabel?: string
  children: ReactNode
  intro: string
  title: string
}) {
  return (
    <main style={tokenStoryStyles.surface}>
      <p style={tokenStoryStyles.eyebrow}>{assetLabel}</p>
      <div style={tokenStoryStyles.title}>{title}</div>
      <p style={tokenStoryStyles.description}>{intro}</p>
      <section style={tokenStoryStyles.section}>{children}</section>
    </main>
  )
}

export function TokenHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        color: "var(--text-primary, var(--foreground, #222))",
        fontFamily: "var(--font-family-ios, var(--font-sans, system-ui, sans-serif))",
        fontSize: "var(--font-size-heading-md, 20px)",
        fontWeight: "var(--font-weight-emphasize, 600)",
        lineHeight: "var(--line-height-heading-md, 28px)",
        margin: 0,
      }}
    >
      {children}
    </h2>
  )
}

function TokenMeta({ assetId, item }: { assetId: string; item: TokenStoryItem }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span style={tokenStoryStyles.caption}>source: {normalizeSourcePath(item.sourcePath, assetId)}</span>
      {item.sourceKind === "alias" ? <span style={tokenStoryStyles.caption}>source kind: read-only alias</span> : null}
      {item.pointer ? <span style={tokenStoryStyles.caption}>pointer: {item.pointer}</span> : null}
      {item.context ? <span style={tokenStoryStyles.caption}>context: {item.context}</span> : null}
      {item.aliasOf ? <span style={tokenStoryStyles.caption}>alias: {item.aliasOf}</span> : null}
    </div>
  )
}

export function TokenCard({
  assetId,
  item,
  showMetadata = false,
  showSwatch = false,
}: {
  assetId: string
  item: TokenStoryItem
  showMetadata?: boolean
  showSwatch?: boolean
}) {
  const swatchValue = item.swatchValue ?? (typeof item.value === "string" ? item.value : undefined)
  const hasTransparentSwatch = colorHasTransparency(swatchValue ?? item.value)
  const swatchFill = swatchValue ? `var(${item.token}, ${swatchValue})` : "var(--surface-secondary, var(--muted, #f5f5f5))"
  const checkerboardBackground = [
    "linear-gradient(45deg, #d8d8d8 25%, transparent 25%)",
    "linear-gradient(-45deg, #d8d8d8 25%, transparent 25%)",
    "linear-gradient(45deg, transparent 75%, #d8d8d8 75%)",
    "linear-gradient(-45deg, transparent 75%, #d8d8d8 75%)",
  ].join(", ")

  return (
    <article style={tokenStoryStyles.card}>
      {showSwatch ? (
        <div
          aria-label={`${item.token} swatch`}
          role="img"
          style={{
            background: hasTransparentSwatch ? "#fff" : swatchFill,
            backgroundImage: hasTransparentSwatch ? checkerboardBackground : undefined,
            backgroundPosition: hasTransparentSwatch ? "0 0, 0 8px, 8px -8px, -8px 0" : undefined,
            backgroundSize: hasTransparentSwatch ? "16px 16px" : undefined,
            minHeight: 88,
            position: "relative",
          }}
        >
          {hasTransparentSwatch ? (
            <div
              aria-hidden
              style={{
                background: swatchFill,
                inset: 0,
                position: "absolute",
              }}
            />
          ) : null}
        </div>
      ) : null}
      <div style={tokenStoryStyles.cardBody}>
        <strong style={tokenStoryStyles.tokenName}>{item.sourceLabel ?? item.token}</strong>
        <span style={tokenStoryStyles.caption}>value: {formatTokenValue(item.value)}</span>
        {item.description ? <span style={tokenStoryStyles.caption}>{item.description}</span> : null}
        {showMetadata ? <TokenMeta assetId={assetId} item={item} /> : null}
      </div>
    </article>
  )
}

export function TokenValueGrid({
  assetId = "yami",
  showMetadata = false,
  showSwatches = false,
  tokens,
}: {
  assetId?: string
  showMetadata?: boolean
  showSwatches?: boolean
  tokens: TokenRecord[]
}) {
  return (
    <div style={tokenStoryStyles.grid}>
      {tokens.map((item) => (
        <TokenCard
          assetId={assetId}
          item={item}
          key={tokenStoryKey(item)}
          showMetadata={showMetadata}
          showSwatch={showSwatches}
        />
      ))}
    </div>
  )
}

export function ColorGrid({ assetId = "yami", tokens }: { assetId?: string; tokens: ColorToken[] }) {
  return <TokenValueGrid assetId={assetId} showSwatches tokens={tokens} />
}

export function TokenGroups({
  assetId = "yami",
  groups,
  showMetadata = false,
  showSwatches = false,
}: {
  assetId?: string
  groups: TokenStoryGroup[]
  showMetadata?: boolean
  showSwatches?: boolean
}) {
  return (
    <div style={{ display: "grid", gap: "var(--space-200, 16px)" }}>
      {groups.map((group) => (
        <section key={group.label} style={{ display: "grid", gap: "var(--space-100, 8px)" }}>
          <TokenHeading>{group.label}</TokenHeading>
          <TokenValueGrid assetId={assetId} showMetadata={showMetadata} showSwatches={showSwatches} tokens={group.tokens} />
        </section>
      ))}
    </div>
  )
}

export function ColorGroups({ assetId = "yami", groups }: { assetId?: string; groups: ColorTokenGroup[] }) {
  return <TokenGroups assetId={assetId} groups={groups} showSwatches />
}
