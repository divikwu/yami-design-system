import baseMeta, * as examples from "./ProductList.story-examples";

export default { ...baseMeta, title: "YAMI/Components/Commerce/Product List/Mobile" };

export const MobileTitleSizes = { ...examples.MobileTitleSizes, name: "Title sizes" };
export const MobilePlain = { ...examples.MobilePlain, name: "Plain" };
export const ThemedBackgroundMobile = { ...examples.ThemedBackgroundMobile, name: "Banner · Plain" };
export const BackgroundRailMobile = { ...examples.BackgroundRailMobile, name: "Background · Plain" };
export const StandardCenteredMobile = { ...examples.StandardCenteredMobile, name: "Centered · Standard" };
export const BackgroundCenteredMobile = { ...examples.BackgroundCenteredMobile, name: "Centered · Background" };
export const ThemedBackgroundCenteredMobile = { ...examples.ThemedBackgroundCenteredMobile, name: "Centered · Banner" };
