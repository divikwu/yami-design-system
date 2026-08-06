import { figma } from "@figma/code-connect"

import { RadioGroup, RadioGroupItem } from "./RadioGroup"

figma.connect(
  RadioGroupItem,
  "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines?node-id=4795-90633",
  {
    props: {
      selected: figma.enum("Property 1", {
        Default: false,
        Hover: false,
        Selected: true,
        Disable_Selected: true,
        Disable_Unselected: false,
      }),
      disabled: figma.enum("Property 1", {
        Default: false,
        Hover: false,
        Selected: false,
        Disable_Selected: true,
        Disable_Unselected: true,
      }),
    },
    example: ({ selected, disabled }) => (
      <RadioGroup aria-label="Radio group" value={selected ? "option" : undefined}>
        <RadioGroupItem aria-label="Option" value="option" disabled={disabled} />
      </RadioGroup>
    ),
  },
)
