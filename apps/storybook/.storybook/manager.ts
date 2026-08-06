import { addons } from "storybook/manager-api";
import { create } from "storybook/theming/create";

addons.setConfig({
  theme: create({ base: "light", brandTitle: "YAMI Canvas", brandUrl: "/", colorPrimary: "#ff2d2d", colorSecondary: "#202020" })
});
