import { SocialMediaGallery } from "./SocialMediaGallery";
import { createSocialMediaGalleryFixture } from "./fixtures";

export function SocialMediaGalleryExample() {
  return <SocialMediaGallery {...createSocialMediaGalleryFixture("en")} />;
}
