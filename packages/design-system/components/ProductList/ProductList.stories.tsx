import baseMeta, * as examples from "./ProductList.story-examples";

export default { ...baseMeta, title: "YAMI/Components/Commerce/Product List" };

export const Showcase = { ...examples.Showcase, name: "Overview", play: examples.Showcase.play };
