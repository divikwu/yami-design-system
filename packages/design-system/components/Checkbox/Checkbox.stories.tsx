import type { CSSProperties } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent } from "storybook/test"

import { Checkbox } from "./Checkbox"

const meta = {
  title: "YAMI/Components/Forms/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "YAMI Checkbox from Figma `↪ 表单输入 Forms`: 24px frame, 20px visible control, neutral selected state, and Base UI form/keyboard behavior.",
      },
    },
  },
  argTypes: {
    checked: { control: "boolean" },
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
    indeterminate: { control: "boolean" },
    required: { control: "boolean" },
  },
  args: {
    "aria-label": "Checkbox",
    disabled: false,
    indeterminate: false,
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

const showcaseStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-400)",
  width: "min(560px, 100%)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-family-ios)",
}

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-300)",
  alignItems: "center",
}

const optionStyle: CSSProperties = {
  display: "inline-flex",
  gap: "var(--space-100)",
  alignItems: "center",
  minHeight: "var(--space-600)",
  color: "var(--text-primary)",
  fontSize: "var(--font-size-body-md)",
  lineHeight: "var(--line-height-body-md)",
}

function Example({
  id,
  label,
  checked = false,
  disabled = false,
  indeterminate = false,
}: {
  id: string
  label: string
  checked?: boolean
  disabled?: boolean
  indeterminate?: boolean
}) {
  return (
    <label htmlFor={id} style={{ ...optionStyle, color: disabled ? "var(--text-disabled)" : undefined }}>
      <Checkbox
        id={id}
        data-demo={id === "checkbox-default" ? "unchecked" : undefined}
        checked={checked}
        disabled={disabled}
        indeterminate={indeterminate}
      />
      <span>{label}</span>
    </label>
  )
}

export const Showcase: Story = {
  render: () => (
    <section data-checkbox-showcase style={showcaseStyle}>
      <div style={rowStyle}>
        <Example id="checkbox-default" label="Default" />
        <Example id="checkbox-selected" label="Selected" checked />
        <Example id="checkbox-disabled-selected" label="Disabled selected" checked disabled />
        <Example id="checkbox-disabled" label="Disabled" disabled />
        <Example id="checkbox-mixed" label="Mixed" indeterminate />
      </div>
      <label htmlFor="checkbox-interactive" style={optionStyle}>
        <Checkbox id="checkbox-interactive" data-demo="interactive" />
        <span>Save payment method · 保存付款方式</span>
      </label>
    </section>
  ),
  play: async ({ canvasElement }) => {
    const checkbox = canvasElement.querySelector<HTMLElement>('[data-demo="interactive"]')
    if (!checkbox) throw new Error("Checkbox interaction specimen did not render")

    const rootStyle = getComputedStyle(checkbox)
    const visibleStyle = getComputedStyle(checkbox, "::before")
    const hitAreaStyle = getComputedStyle(checkbox, "::after")
    const uncheckedCheckbox = canvasElement.querySelector<HTMLElement>(
      '[data-demo="unchecked"]',
    )
    const indicator = uncheckedCheckbox?.querySelector<HTMLElement>(
      '[data-slot="checkbox-indicator"]',
    )
    if (
      rootStyle.width !== "20px" ||
      rootStyle.height !== "20px" ||
      visibleStyle.width !== "20px" ||
      visibleStyle.height !== "20px" ||
      visibleStyle.borderRadius !== "4px" ||
      hitAreaStyle.inset !== "-2px"
    ) {
      throw new Error("Checkbox must retain its 20px control, 24px pointer target, and 4px radius")
    }
    if (visibleStyle.borderColor !== "rgba(0, 0, 0, 0.08)") {
      throw new Error("Unchecked Checkbox must use the subtle default border token")
    }

    if (!uncheckedCheckbox) throw new Error("Unchecked Checkbox specimen did not render")
    await userEvent.hover(uncheckedCheckbox)
    if (
      indicator &&
      getComputedStyle(uncheckedCheckbox).color !== "rgba(0, 0, 0, 0)"
    ) {
      throw new Error("Unchecked Checkbox must not reveal its indicator on hover")
    }
    await userEvent.unhover(uncheckedCheckbox)

    checkbox.click()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    if (checkbox.getAttribute("aria-checked") !== "true") {
      throw new Error("Checkbox did not expose its selected state")
    }
    await userEvent.hover(checkbox)
    const selectedHover = getComputedStyle(checkbox, "::before")
    const selectedHoverRgb = selectedHover.backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number)
    if (!selectedHoverRgb || selectedHoverRgb.some((channel) => channel > 64)) {
      throw new Error("Selected Checkbox hover must retain a dark selected surface")
    }
    await userEvent.unhover(checkbox)
    canvasElement.dataset.checkboxInteractionContract = "passed"
  },
}

export const Playground: Story = {
  render: (args) => <Checkbox {...args} />,
}

export const Selected: Story = { args: { defaultChecked: true } }
export const DisabledSelected: Story = { args: { defaultChecked: true, disabled: true } }
export const Indeterminate: Story = { args: { indeterminate: true } }
