import type { CSSProperties, ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { RadioGroup, RadioGroupItem } from "./RadioGroup"

const meta = {
  title: "YAMI/Components/Forms/Radio Group",
  component: RadioGroup,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "YAMI Radio Button from Figma `↪ 表单输入 Forms`, composed as an accessible Base UI RadioGroup for exclusive selection and arrow-key navigation.",
      },
    },
  },
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const showcaseStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-400)",
  width: "min(620px, 100%)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-family-ios)",
}

const stateRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-300)",
  alignItems: "center",
}

const optionStyle: CSSProperties = {
  display: "inline-flex",
  minHeight: "var(--space-600)",
  alignItems: "center",
  gap: "var(--space-100)",
  color: "var(--text-primary)",
  fontSize: "var(--font-size-body-md)",
  lineHeight: "var(--line-height-body-md)",
}

const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontSize: "var(--font-size-caption-md)",
  lineHeight: "var(--line-height-caption-md)",
}

function Option({ value, children, disabled = false, demo }: { value: string; children: ReactNode; disabled?: boolean; demo?: string }) {
  return (
    <label style={{ ...optionStyle, color: disabled ? "var(--text-disabled)" : undefined }}>
      <RadioGroupItem value={value} disabled={disabled} data-demo={demo} />
      <span>{children}</span>
    </label>
  )
}

export const Showcase: Story = {
  render: () => (
    <section data-radio-showcase style={showcaseStyle}>
      <div>
        <p style={titleStyle}>Figma states</p>
        <div style={stateRowStyle}>
          <RadioGroup aria-label="Default example">
            <Option value="default" demo="unchecked">Default</Option>
          </RadioGroup>
          <RadioGroup aria-label="Selected example" value="selected">
            <Option value="selected" demo="selected">Selected</Option>
          </RadioGroup>
          <RadioGroup aria-label="Disabled selected example" defaultValue="selected" disabled>
            <Option value="selected">Disabled selected</Option>
          </RadioGroup>
          <RadioGroup aria-label="Disabled example" disabled>
            <Option value="disabled">Disabled</Option>
          </RadioGroup>
        </div>
      </div>

      <div>
        <p style={titleStyle}>Payment method · 付款方式</p>
        <RadioGroup name="payment-method" defaultValue="card" data-demo="interactive">
          <Option value="card">Card · 银行卡</Option>
          <Option value="apple-pay">Apple Pay</Option>
          <Option value="google-pay">Google Pay</Option>
        </RadioGroup>
      </div>
    </section>
  ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<HTMLElement>('[data-demo="interactive"]')
    const radios = Array.from(group?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])
    const unchecked = canvasElement.querySelector<HTMLElement>('[data-demo="unchecked"]')
    if (radios.length !== 3) throw new Error("RadioGroup interaction specimen did not render")
    if (!unchecked) throw new Error("RadioGroup state specimens did not render")

    const uncheckedStyle = getComputedStyle(unchecked)
    const uncheckedSurface = getComputedStyle(unchecked, "::before")
    const hitArea = getComputedStyle(unchecked, "::after")
    if (
      uncheckedStyle.width !== "20px" ||
      uncheckedStyle.height !== "20px" ||
      uncheckedSurface.width !== "20px" ||
      uncheckedSurface.height !== "20px" ||
      hitArea.inset !== "-2px" ||
      uncheckedSurface.borderColor !== "rgba(0, 0, 0, 0.08)"
    ) {
      throw new Error("RadioGroupItem must match the Checkbox geometry and subtle border")
    }

    radios[1].click()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    const selected = radios.filter((radio) => radio.getAttribute("aria-checked") === "true")
    if (selected.length !== 1 || selected[0] !== radios[1]) {
      throw new Error("RadioGroup did not preserve exclusive selection")
    }
    canvasElement.dataset.radioInteractionContract = "passed"
  },
}

export const Playground: Story = {
  render: (args) => (
    <RadioGroup {...args} defaultValue="card">
      <Option value="card">Card · 银行卡</Option>
      <Option value="apple-pay">Apple Pay</Option>
      <Option value="google-pay">Google Pay</Option>
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="card" disabled>
      <Option value="card">Card · 银行卡</Option>
      <Option value="apple-pay">Apple Pay</Option>
    </RadioGroup>
  ),
}
