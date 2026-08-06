import { figma } from "@figma/code-connect"

import { Checkbox } from "./Checkbox"

figma.connect(
  Checkbox,
  "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines?node-id=4795-90512",
  {
    props: {
      checked: figma.enum("Status", {
        Default: false,
        Hover: false,
        Selected: true,
        Disable_Selected: true,
        Disable_Unselected: false,
      }),
      disabled: figma.enum("Status", {
        Default: false,
        Hover: false,
        Selected: false,
        Disable_Selected: true,
        Disable_Unselected: true,
      }),
    },
    example: ({ checked, disabled }) => (
      <Checkbox aria-label="Checkbox" checked={checked} disabled={disabled} />
    ),
  },
)
