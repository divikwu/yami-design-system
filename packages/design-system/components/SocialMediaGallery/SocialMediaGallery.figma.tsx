import { figma } from "@figma/code-connect";

import { SocialMediaGallery } from "./SocialMediaGallery";
import { SocialVideoCard } from "./SocialVideoCard";
import { createSocialMediaGalleryFixture, createSocialVideoCards } from "./fixtures";

const FIGMA_FILE =
  "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines";

figma.connect(SocialMediaGallery, `${FIGMA_FILE}?node-id=6993-63493`, {
  props: {},
  example: () => (
    <SocialMediaGallery {...createSocialMediaGalleryFixture("en")} />
  ),
});

figma.connect(SocialMediaGallery, `${FIGMA_FILE}?node-id=6962-102989`, {
  props: {},
  example: () => (
    <SocialMediaGallery {...createSocialMediaGalleryFixture("en")} />
  ),
});

figma.connect(SocialVideoCard, `${FIGMA_FILE}?node-id=6993-63472`, {
  props: {},
  example: () => <SocialVideoCard {...createSocialVideoCards("en")[0]} />,
});
