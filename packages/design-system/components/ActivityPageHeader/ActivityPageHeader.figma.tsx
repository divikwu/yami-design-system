import { figma } from "@figma/code-connect";

import { ActivityPageHeader } from "./ActivityPageHeader";

const FIGMA_FILE =
  "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines";

figma.connect(ActivityPageHeader, `${FIGMA_FILE}?node-id=7592-65365`, {
  props: {},
  example: () => (
    <ActivityPageHeader
      title="Title"
      homeHref="/en"
      onSearch={() => {}}
      onCart={() => {}}
    />
  ),
});
