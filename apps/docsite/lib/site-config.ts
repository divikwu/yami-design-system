import repositoryPackage from "../../../package.json";

export const siteUrl = (process.env.SITE_URL ?? "https://yami-design-system-docsite.vercel.app").replace(/\/$/, "");
export const githubUrl = "https://github.com/divikwu/yami-design-system";
export const storybookUrl = "https://yami-design-system-storybook.vercel.app";
export const siteName = "YAMI Design System";
export const siteVersion = repositoryPackage.version;
