import type { Preview } from "@storybook/react-vite";
import React from "react";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import "./preview.css";

const YAMI_VIEWPORTS = {
  yamiMobileSm: { name: "YAMI Mobile-sm (360)", styles: { width: "360px", height: "800px" }, type: "mobile" as const },
  yamiMobile: { name: "YAMI Mobile (375)", styles: { width: "375px", height: "812px" }, type: "mobile" as const },
  yamiMobileLg: { name: "YAMI Mobile-lg (402)", styles: { width: "402px", height: "844px" }, type: "mobile" as const },
  yamiMobileXl: { name: "YAMI Mobile-xl (480)", styles: { width: "480px", height: "900px" }, type: "mobile" as const },
  yamiTablet: { name: "YAMI Tablet (768)", styles: { width: "768px", height: "1024px" }, type: "tablet" as const },
  yamiDesktop: { name: "YAMI Desktop (1024)", styles: { width: "1024px", height: "768px" }, type: "desktop" as const },
  yamiDesktopMd: { name: "YAMI Desktop-md (1280)", styles: { width: "1280px", height: "800px" }, type: "desktop" as const },
  yamiDesktopLg: { name: "YAMI Desktop-lg (1440)", styles: { width: "1440px", height: "900px" }, type: "desktop" as const },
  yamiDesktopXl: { name: "YAMI Desktop-xl (1920)", styles: { width: "1920px", height: "1080px" }, type: "desktop" as const }
};

const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    locale: { description: "Content language", toolbar: { icon: "globe", items: [{ value: "zh", title: "中文" }, { value: "en", title: "English" }] } },
    theme: { description: "Color theme", toolbar: { icon: "paintbrush", items: [{ value: "light", title: "Light" }, { value: "dark", title: "Dark" }] } }
  },
  initialGlobals: {
    locale: "zh",
    theme: "light",
    viewport: { value: "yamiMobile", isRotated: false }
  },
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    a11y: { test: "error" },
    viewport: {
      options: YAMI_VIEWPORTS
    },
    options: { storySort: { order: ["YAMI", ["Foundations", "Primitives", "Assets", "Components", "Pages"]] } }
  },
  decorators: [
    (Story, context) => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", context.globals.theme === "dark");
      }

      return (
        <div data-theme={context.globals.theme} data-locale={context.globals.locale} className="yami-story-root">
          <Story />
        </div>
      );
    }
  ]
};

export default preview;
