import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./Button"

// Heart icon from design-systems/yami/assets/icons/action/heart.svg.
// Inlined as a component so the showcase exercises the canonical SVG path
// (currentColor inheritance, 20px viewBox at md size) instead of the ♥
// text glyph — which has uncentered glyph metrics and misrepresents how
// the Button actually ships in production.
function HeartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.9582 5.07637C17.9068 2.99934 14.5849 2.99953 12.5337 5.07694C12.3928 5.21966 12.2006 5.29999 12 5.29999C11.7994 5.29999 11.6072 5.21966 11.4663 5.07694C10.4395 4.03704 9.0989 3.51999 7.75499 3.51999C6.41028 3.51999 5.06523 4.03757 4.04174 5.07637L4.0409 5.07722C1.98469 7.15755 1.98469 10.5324 4.0409 12.6128L12 20.6656L19.9582 12.6136C19.9583 12.6135 19.9584 12.6135 19.9585 12.6134C20.9844 11.572 21.5 10.2112 21.5 8.84499C21.5 7.47869 20.9843 6.11775 19.9582 5.07637ZM12 3.53645C14.6539 1.3619 18.5588 1.52409 21.0262 4.02304L21.0267 4.02361C22.3407 5.35722 23 7.10129 23 8.84499C23 10.5887 22.3407 12.3328 21.0267 13.6664L12.5334 22.2597C12.3925 22.4023 12.2004 22.4825 12 22.4825C11.7996 22.4825 11.6075 22.4023 11.4666 22.2597L2.97408 13.6672C2.97408 13.6672 2.97408 13.6672 2.97408 13.6672C0.340449 11.0027 0.340301 6.68788 2.97366 4.02318C4.29012 2.68726 6.02489 2.01999 7.75499 2.01999C9.26119 2.01999 10.7661 2.52565 12 3.53645Z"
        fill="currentColor"
      />
    </svg>
  )
}

const meta = {
  title: "YAMI/Components/Actions/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "YAMI Button — mirrors Figma `Mobile v2` + `PC v2` (file 6oOAy72DBff4P6NzJYc2hi). Hierarchy × Form × Size × Surface. Inverse variants render on the current theme's opposite-polarity `--surface-inverse`.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["emphasis", "primary", "secondary", "tertiary"],
    },
    form: {
      control: "select",
      options: ["full", "inline", "icon"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    inverse: { control: "boolean" },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Action",
    variant: "primary",
    form: "inline",
    size: "md",
    inverse: false,
    loading: false,
    disabled: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

const VARIANTS = ["emphasis", "primary", "secondary", "tertiary"] as const
const SIZES = ["sm", "md", "lg"] as const

// ───── Minimal layout primitives (shadcn-style: flex rows + tiny labels) ─────

const stackStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-400)",
  maxWidth: 480,
  width: "100%",
  fontFamily: "var(--font-family-ios)",
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-150)",
  alignItems: "center",
}

const rowLabelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-caption-sm)",
  color: "var(--text-secondary)",
  marginBottom: "var(--space-100)",
}

function Row({ label, children, inverse = false }: { label: string; children: React.ReactNode; inverse?: boolean }) {
  return (
    <div>
      <div style={{ ...rowLabelStyle, color: inverse ? "var(--text-secondary-inverse)" : "var(--text-secondary)" }}>
        {label}
      </div>
      <div style={rowStyle}>{children}</div>
    </div>
  )
}

// ───────────────────────────── Stories ─────────────────────────────

/**
 * Showcase — the canonical matrix shown in the docs and required by the
 * YAMI Components story rule (`requiredExports: ["Showcase"]`).
 *
 * Renders, in order: Hierarchy × Form (default surface), Size, States,
 * Inverse surface. Matches the visual structure of the Figma reference
 * pages (Mobile v2 / PC v2).
 */
export const Showcase: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={stackStyle}>
      <Row label="Hierarchy">
        {VARIANTS.map((v) => (
          <Button key={v} variant={v}>
            {v[0].toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </Row>

      <Row label="Size">
        {SIZES.map((s) => (
          <Button key={s} size={s}>
            Action
          </Button>
        ))}
      </Row>

      <Row label="Form">
        <Button form="inline">Inline</Button>
        <Button form="icon" variant="secondary" aria-label="Favorite">
          <HeartIcon />
        </Button>
        <Button form="full" variant="emphasis">
          Buy Now
        </Button>
      </Row>

      <Row label="State">
        <Button variant="emphasis">Action</Button>
        <Button variant="emphasis" loading>
          Action
        </Button>
        <Button variant="emphasis" disabled>
          Action
        </Button>
      </Row>

      <div
        style={{
          background: "var(--surface-inverse)",
          padding: "var(--space-300)",
          borderRadius: "var(--radius-surface-default)",
        }}
      >
        <Row label="Inverse" inverse>
          {VARIANTS.map((v) => (
            <Button key={v} variant={v} inverse>
              {v[0].toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </Row>
      </div>
    </div>
  ),
}

/** Interactive playground — drive every prop via the Controls panel. */
export const Playground: Story = {}

/** Emphasis CTA — the page's single permission-to-act button. */
export const Emphasis: Story = {
  args: { variant: "emphasis", children: "Add to Cart" },
}

/** Full-width CTA — page-level commitment. */
export const FullWidth: Story = {
  args: { form: "full", variant: "emphasis", children: "Checkout" },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector<HTMLButtonElement>("button")
    if (!button) throw new Error("Full-width Button did not render")
    const styles = getComputedStyle(button)
    const expectedRadius = styles.getPropertyValue("--radius-sm").trim()
    if (styles.borderRadius !== expectedRadius) {
      throw new Error(
        `Full-width Button must use the compact radius; received ${styles.borderRadius}`,
      )
    }
  },
}

/** Icon-only — square, aria-label required. */
export const IconOnly: Story = {
  args: {
    form: "icon",
    variant: "secondary",
    "aria-label": "Add to favorites",
  },
  render: (args) => (
    <Button {...args}>
      <HeartIcon />
    </Button>
  ),
}

/** Loading — spinner replaces content, aria-busy set. */
export const Loading: Story = {
  args: { variant: "emphasis", loading: true, children: "Submitting" },
}

/** Disabled — uses token color pair, never opacity (rule no-opacity-disabled). */
export const Disabled: Story = {
  args: { variant: "primary", disabled: true, children: "Unavailable" },
}

/** Inverse surface — rendered on a dark card to verify contrast. */
export const Inverse: Story = {
  args: { variant: "emphasis", inverse: true, children: "Inverse" },
  decorators: [
    (Story) => (
      <div
        style={{
          background: "var(--surface-inverse)",
          padding: "var(--space-400)",
          borderRadius: "var(--radius-surface-default)",
        }}
      >
        <Story />
      </div>
    ),
  ],
}
