import { storybookUrl } from "./site-config";

export const docGroups = ["start", "ai", "collaboration", "maintenance", "resources"] as const;
export type DocGroup = (typeof docGroups)[number];

export const storybookResources = {
  components: `${storybookUrl}/?path=/story/yami-components-actions-button--showcase`,
  foundations: `${storybookUrl}/?path=/story/yami-foundations-color--overview`,
  pages: `${storybookUrl}/?path=/story/yami-pages-ecommerce-home--pc`,
};
