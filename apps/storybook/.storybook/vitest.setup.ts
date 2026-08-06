import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/react-vite";

import * as projectAnnotations from "./preview";

const annotations = setProjectAnnotations([
  projectAnnotations,
  {
    initialGlobals: {
      ...projectAnnotations.default.initialGlobals,
      viewport: { value: "yamiDesktopMd", isRotated: false },
    },
  },
]);

beforeAll(annotations.beforeAll);
