import baseMeta, * as examples from "./ProductList.story-examples";

export default { ...baseMeta, title: "YAMI/Components/Commerce/Product List/Centered" };

export const StandardCentered = { ...examples.StandardCentered, name: "Standard" };
export const BackgroundCentered = { ...examples.BackgroundCentered, name: "Background" };
export const ThemedBackgroundCentered = { ...examples.ThemedBackgroundCentered, name: "Banner" };
