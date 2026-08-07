import { figma } from "@figma/code-connect";

import { ThemeHero } from "./ThemeHero";
import { createThemeHeroProps } from "./fixtures";

const FIGMA_FILE =
  "https://www.figma.com/design/wE2APma1NxPl3eHM5NFpU9/English-Site-Optimization-2026";

figma.connect(ThemeHero, `${FIGMA_FILE}?node-id=1877-43111`, {
  props: {},
  example: () => <ThemeHero {...createThemeHeroProps()} />,
});
