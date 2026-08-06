import type { Meta, StoryObj } from "@storybook/react-vite"

import primitiveColorTokensSource from "./tokens/primitives/colors.tokens.json"
import { ColorGroups, TokenStoryFrame, primitiveColorGroups } from "./token-story"

const meta = {
  title: "YAMI/Primitives/color-primitives",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "YAMI `color-primitives` variable collection rendered from the raw Figma token import.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const PRIMITIVE_COLOR_GROUPS = primitiveColorGroups(primitiveColorTokensSource, "tokens/primitives/colors.tokens.json")

export const Overview: Story = {
  render: () => (
    <TokenStoryFrame
      title="color-primitives"
      intro="Primitive color tokens are rendered from the raw `color-primitives` collection. Values and descriptions stay aligned to Figma."
    >
      <ColorGroups groups={PRIMITIVE_COLOR_GROUPS} />
    </TokenStoryFrame>
  ),
}
