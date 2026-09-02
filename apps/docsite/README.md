# YAMI Docsite

YAMI Docsite is the bilingual documentation and Blog application for the YAMI
Design System. It borrows Astryx's information architecture—top navigation,
three-column documentation, search palette, and Blog hierarchy—while using
YAMI components, assets, fonts, and generated semantic tokens for presentation.

It does not replace Storybook. Docsite explains foundations and workflows;
Storybook remains the source of truth for component APIs, states, and examples.

## Run locally

From the repository root:

```bash
pnpm dev:docsite
```

Open `http://localhost:3400/zh`. The root path redirects to Chinese by design.

Useful checks:

```bash
pnpm check:docsite-content
pnpm test:docsite
pnpm build:docsite
pnpm test:docsite:e2e
pnpm test:docsite:lighthouse
```

## Application structure

```text
apps/docsite/
├── app/                     # Next.js App Router, metadata, RSS, sitemap
├── components/              # Docsite layouts and interactions
├── content/
│   ├── docs/{zh,en}/        # Paired foundation and workflow documents
│   ├── blog/{zh,en}/        # Paired long-form Blog posts
│   └── site/{zh,en}.ts      # Navigation, home, utility, and a11y copy
├── lib/                     # Content parsing, locales, search, theme
├── scripts/check-content.mjs
└── tests/{unit,e2e}/
```

Content is repository Markdown and is statically generated at build time. The
application has no CMS, database, authentication, runtime search service, or
content API.

## Author content

Documentation frontmatter is validated against `DocFrontmatter`; Blog
frontmatter is validated against `BlogFrontmatter`. A Chinese file and its
English pair must use the same filename and stable slug. Structural fields,
source references, dates, categories, related documents, and heading levels
must remain aligned.

`sourceRefs` are repository-relative and must resolve to an existing YAMI
specification, token source, decision, or component contract. Markdown may use
GFM tables, lists, fenced code, links, and level-two or level-three headings.
Raw HTML and JSX are rejected. Token examples are checked against
`packages/design-system/generated/tokens.css`.

English heading slugs are the stable cross-language anchor IDs. The Chinese and
English documents therefore keep the same resource and anchor when language is
switched, while each language displays its own heading text.

## Search and theme

The build serializes an independent static search index for each locale. Search
never mixes languages and ranks exact title, title prefix, keyword, section,
then summary or body matches. No external search provider receives queries.

Theme resolution runs before hydration. A first visit follows the system; an
explicit light or dark choice is stored under `yami-docsite-theme`. Components
consume YAMI semantic aliases in both themes.

## Deployment boundary

The intended Vercel project is `yami-design-system-docsite`, with Root Directory
`apps/docsite`. `SITE_URL` supplies canonical, sitemap, and RSS origins. Git
deployments are disabled in `vercel.json`; every Preview and Production release
requires separate authorization and must record its commit SHA, CI result,
domain, and manual desktop/mobile, language, and theme sampling.

This application reuses existing YAMI fonts, logos, and icons. Public deployment
does not establish redistribution rights. Review
`docs/migration/asset-rights.csv` before any public promotion.
