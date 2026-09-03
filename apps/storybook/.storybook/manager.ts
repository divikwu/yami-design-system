import { createElement } from "react";
import { addons, types } from "storybook/manager-api";
import { IconButton } from "storybook/internal/components";
import { create } from "storybook/theming/create";

addons.setConfig({
  theme: create({ base: "light", brandTitle: "Yami Design System", brandUrl: "/", colorPrimary: "#ff2d2d", colorSecondary: "#202020" })
});

if (process.env.NODE_ENV === "production") {
  addons.register("yami/site-access", () => {
    addons.add("yami/site-access/logout", {
      type: types.TOOL,
      title: "退出访问 / Sign out",
      render: () => createElement(IconButton, {
        title: "退出访问 / Sign out",
        onClick: () => window.location.assign(`/__access/logout?next=${encodeURIComponent(window.location.pathname + window.location.search)}`),
      }, "退出 / Sign out"),
    });
  });
}
