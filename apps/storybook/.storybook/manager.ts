import { addons } from "storybook/manager-api";
import { create } from "storybook/theming/create";

addons.setConfig({
  theme: create({ base: "light", brandTitle: "Yami Design System", brandUrl: "/", colorPrimary: "#ff2d2d", colorSecondary: "#202020" })
});
