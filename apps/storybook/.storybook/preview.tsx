import type { Preview } from "@storybook/react-vite";
import React from "react";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import "./preview.css";

const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    locale: { description: "Content language", toolbar: { icon: "globe", items: [{ value: "zh", title: "中文" }, { value: "en", title: "English" }] } },
    theme: { description: "Color theme", toolbar: { icon: "paintbrush", items: [{ value: "light", title: "Light" }, { value: "dark", title: "Dark" }] } }
  },
  initialGlobals: { locale: "zh", theme: "light" },
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    a11y: { test: "error" },
    viewport: {
      options: {
        yamiMobile: { name: "YAMI Mobile", styles: { width: "360px", height: "800px" } },
        yamiTablet: { name: "YAMI Tablet", styles: { width: "768px", height: "1024px" } },
        yamiDesktopMd: { name: "YAMI Desktop", styles: { width: "1440px", height: "1000px" } }
      }
    },
    options: { storySort: { order: ["YAMI", ["Foundations", "Components", "Pages"]] } }
  },
  decorators: [
    (Story, context) => (
      <div data-theme={context.globals.theme} data-locale={context.globals.locale} className="yami-story-root">
        <Story />
      </div>
    )
  ]
};

export default preview;
