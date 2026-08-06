import type { CSSProperties } from "react"
import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input, type InputState } from "./Input"

const meta = {
  title: "YAMI/Components/Forms/Input",
  component: Input,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "YAMI Input Field from Figma `↪ 表单输入 Forms`: embedded label, responsive Mobile/PC sizing, clear action, disabled, focus, typing, complete, and error states.",
      },
    },
  },
  argTypes: {
    state: {
      control: "select",
      options: [
        "default",
        "focused",
        "typing",
        "complete",
        "error",
        "disabled",
        "disabled-filled",
        "disabled-empty",
      ],
    },
    fullWidth: { control: "boolean" },
    clearable: { control: "boolean" },
    optional: { control: "boolean" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Label",
    placeholder: "",
    state: undefined,
    fullWidth: false,
    clearable: false,
    optional: false,
    required: false,
    disabled: false,
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

const shellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-500)",
  width: "min(760px, 100%)",
  fontFamily: "var(--font-family-ios)",
}

const groupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-200)",
  minWidth: 0,
  maxWidth: "100%",
}

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-200)",
  alignItems: "flex-start",
}

const labelStyle: CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontSize: "var(--font-size-body-md)",
  lineHeight: "var(--line-height-body-md)",
  fontWeight: "var(--font-weight-normal)",
}

const resetButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  minHeight: 32,
  paddingInline: "var(--space-150)",
  border: "var(--stroke-default) solid var(--border-default)",
  borderRadius: "var(--radius-component-default)",
  background: "var(--background-primary)",
  color: "var(--text-primary)",
  font: "inherit",
}

// Search icon from design-systems/yami/assets/icons/action/search.svg.
// Inlined as a component so Storybook renders the canonical currentColor SVG
// path without depending on bundler-specific SVG imports.
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5001 3C14.6422 3 18.0001 6.35786 18.0001 10.5C18.0001 12.3009 17.3637 13.9522 16.3058 15.2451L21.088 20.0273L20.0274 21.0879L15.2452 16.3057C13.9523 17.3636 12.301 18 10.5001 18C6.35796 18 3.0001 14.6421 3.0001 10.5C3.0001 6.35786 6.35796 3 10.5001 3ZM10.5001 4.60742C7.24556 4.60742 4.60752 7.24546 4.60752 10.5C4.60752 13.7545 7.24556 16.3926 10.5001 16.3926C13.7546 16.3926 16.3927 13.7545 16.3927 10.5C16.3927 7.24546 13.7546 4.60742 10.5001 4.60742Z"
        fill="currentColor"
      />
    </svg>
  )
}

function StateExample({
  title,
  state,
  value,
  error,
  disabled,
  clearable,
}: {
  title: string
  state: InputState
  value?: string
  error?: string
  disabled?: boolean
  clearable?: boolean
}) {
  return (
    <div style={groupStyle}>
      <p style={labelStyle}>{title}</p>
      <Input
        label="Label"
        state={state}
        defaultValue={value}
        error={error}
        disabled={disabled}
        clearable={clearable}
      />
    </div>
  )
}

function ControlledClearableInput() {
  const [value, setValue] = useState("Input")

  return (
    <Input
      label="Label"
      value={value}
      clearable
      onChange={(event) => setValue(event.currentTarget.value)}
      onClear={() => setValue("")}
    />
  )
}

function ResettableInput() {
  return (
    <form style={groupStyle}>
      <Input label="Label" />
      <button type="reset" style={resetButtonStyle}>
        Reset
      </button>
    </form>
  )
}

export const Showcase: Story = {
  render: () => (
    <section data-input-showcase style={shellStyle}>
      <div style={rowStyle}>
        <StateExample title="Default" state="default" />
        <StateExample title="Focused" state="focused" />
        <StateExample title="Typing" state="typing" value="Input" clearable />
        <StateExample title="Complete" state="complete" value="Input" />
        <StateExample title="Disabled filled" state="disabled-filled" value="Input" disabled />
        <StateExample title="Disabled empty" state="disabled-empty" disabled />
        <StateExample title="Error" state="error" value="Input" error="Supporting text" />
      </div>

      <div style={groupStyle}>
        <p style={labelStyle}>Search with leading icon</p>
        <Input
          aria-label="Search"
          placeholder="Search YAMI"
          leadingIcon={<SearchIcon />}
          fullWidth
        />
      </div>
    </section>
  ),
  play: async ({ canvasElement }) => {
    const showcase = canvasElement.querySelector<HTMLElement>("[data-input-showcase]")
    const fields = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="input"]'))
    if (!showcase || fields.length === 0) throw new Error("Input responsive showcase did not render")

    const initialWidth = showcase.style.width
    try {
      showcase.style.width = "288px"
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const showcaseRight = showcase.getBoundingClientRect().right
      const overflowingStates = fields
        .filter((field) => field.getBoundingClientRect().right > showcaseRight + 0.5)
        .map((field) => field.dataset.state ?? "unknown")
      if (overflowingStates.length > 0) {
        throw new Error(
          `Input overflows a 288px mobile content width: ${overflowingStates.join(", ")}`,
        )
      }
    } finally {
      showcase.style.width = initialWidth
    }

    canvasElement.dataset.inputResponsiveContract = "passed"
  },
}

export const States: Story = {
  render: () => (
    <div style={rowStyle}>
      <StateExample title="Default" state="default" />
      <StateExample title="Focused" state="focused" />
      <StateExample title="Typing" state="typing" value="Input" clearable />
      <StateExample title="Complete" state="complete" value="Input" />
      <StateExample title="Error" state="error" value="Input" error="Supporting text" />
      <StateExample title="Disabled filled" state="disabled-filled" value="Input" disabled />
      <StateExample title="Disabled empty" state="disabled-empty" disabled />
    </div>
  ),
}

export const Playground: Story = {
  render: (args) => <Input {...args} />,
}

export const Clearable: Story = {
  render: () => <ControlledClearableInput />,
}

export const FormReset: Story = {
  render: () => <ResettableInput />,
}
