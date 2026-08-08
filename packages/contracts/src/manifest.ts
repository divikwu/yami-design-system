import { z } from "zod";
import { TokenOverridesSchema } from "./tokens";

const textValueSchema = z.union([z.string().max(240), z.number().finite()]);
const assetPathSchema = z.string().max(500).refine(
  (value) => /^\/(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\\]*$/.test(value),
  "Assets must use an emitted same-origin path",
);
const colorValueSchema = z.string().regex(/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i);
const imageSchema = z.object({ src: assetPathSchema, alt: z.string().max(240) }).strict();
const linkSchema = z.object({ label: z.string().max(120), href: z.string().max(240).optional() }).strict();
const headerPatchSchema = z.object({
  logo: imageSchema.optional(),
  mobileLogo: imageSchema.optional(),
  darkLogo: imageSchema.optional(),
  darkMobileLogo: imageSchema.optional(),
  homeHref: z.string().max(240).optional(),
  halls: z.array(z.object({ id: z.string().min(1).max(120), label: z.string().max(120) }).strict()).max(8).optional(),
  hallId: z.string().max(120).optional(),
  zipcode: z.object({ code: z.string().max(24), label: z.string().max(120), href: z.string().max(240).optional() }).strict().optional(),
  categories: z.array(z.object({
    id: z.string().min(1).max(120), label: z.string().max(120), href: z.string().max(240).optional(), image: imageSchema.optional(),
    badges: z.array(z.string().max(24)).max(4).optional(), startsGroup: z.boolean().optional(),
  }).strict()).max(36).optional(),
  searchPlaceholder: z.string().max(120).optional(),
  searchValue: z.string().max(200).optional(),
  ariaLabel: z.string().max(120).optional(),
  hallsLabel: z.string().max(120).optional(),
  categoriesLabel: z.string().max(120).optional(),
  searchLabel: z.string().max(120).optional(),
  scanLabel: z.string().max(120).optional(),
  nextCategoriesLabel: z.string().max(120).optional(),
  previousCategoriesLabel: z.string().max(120).optional(),
  account: linkSchema.optional(),
  locale: z.object({ label: z.string().max(24), flag: imageSchema, href: z.string().max(240).optional() }).strict().optional(),
  inbox: linkSchema.optional(),
  cart: z.object({ label: z.string().max(120), href: z.string().max(240).optional(), count: z.number().int().min(0).max(999).optional() }).strict().optional()
}).strict();

const heroItemBase = {
  id: z.string().min(1).max(120),
  href: z.string().min(1).max(240),
  backgroundColor: colorValueSchema.optional(),
};
const heroProductsSchema = z.array(imageSchema).min(1).max(8);
const heroItemSchema = z.union([
  z.object({ ...heroItemBase, image: imageSchema }).strict(),
  z.object({ ...heroItemBase, image: imageSchema, title: textValueSchema, description: textValueSchema.optional() }).strict(),
  z.object({ ...heroItemBase, image: imageSchema, title: textValueSchema, description: textValueSchema.optional(), products: heroProductsSchema }).strict(),
  z.object({ ...heroItemBase, title: textValueSchema, products: heroProductsSchema }).strict(),
]);
const heroPatchSchema = z.object({
  items: z.array(heroItemSchema).min(1).max(12).optional(),
  ariaLabel: z.string().max(120).optional(), previousLabel: z.string().max(120).optional(), nextLabel: z.string().max(120).optional(),
  imageLoading: z.enum(["eager", "lazy"]).optional(), autoAdvance: z.boolean().optional(), autoAdvanceInterval: z.number().min(3).max(30).optional(),
  dividerPosition: z.enum(["top", "bottom", "none"]).optional(), dividerVariant: z.enum(["gray", "black"]).optional(),
}).strict();
const shortcutPatchSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1).max(120), label: textValueSchema, iconSrc: assetPathSchema, href: z.string().min(1).max(240) }).strict()).min(1).max(36).optional(),
  ariaLabel: z.string().max(120).optional(), previousLabel: z.string().max(120).optional(), nextLabel: z.string().max(120).optional(), lines: z.union([z.literal(1), z.literal(2)]).optional(),
}).strict();

const footerPatchSchema = z.object({
  columns: z.array(z.object({ id: z.string().min(1).max(120), groups: z.array(z.object({
    id: z.string().min(1).max(120), title: z.string().max(120), links: z.array(z.object({ id: z.string().min(1).max(120), label: z.string().max(120), href: z.string().max(240).optional() }).strict()).max(20),
  }).strict()).max(10) }).strict()).max(8).optional(),
  subscribe: z.object({ title: z.string().max(160), label: z.string().max(120), placeholder: z.string().max(160).optional(), submitLabel: z.string().max(120), value: z.string().max(320).optional(), error: z.string().max(240).optional() }).strict().optional(),
  socialLinks: z.array(z.object({ id: z.string().min(1).max(120), label: z.string().max(120), icon: imageSchema, href: z.string().max(240).optional() }).strict()).max(12).optional(),
  appTitle: z.string().max(160).optional(),
  appLinks: z.array(z.object({ id: z.string().min(1).max(120), label: z.string().max(120), icon: imageSchema.optional(), href: z.string().max(240).optional() }).strict()).max(8).optional(),
  copyright: z.union([z.string().max(500), z.array(z.string().max(240)).max(8)]).optional(),
  legalLinks: z.array(z.object({ id: z.string().min(1).max(120), label: z.string().max(120), href: z.string().max(240).optional(), ariaLabel: z.string().max(200).optional() }).strict()).max(16).optional(),
  paymentMarks: z.array(z.object({ id: z.string().min(1).max(120), label: z.string().max(120), icon: imageSchema }).strict()).max(16).optional(),
  ariaLabel: z.string().max(120).optional(), socialLabel: z.string().max(120).optional(), legalLabel: z.string().max(120).optional(), paymentLabel: z.string().max(120).optional(),
}).strict();

const sharedSectionProps = {
  title: z.string().max(160).optional(),
  mobileTitle: z.string().max(160).optional(),
  viewAllHref: z.string().max(240).optional(),
  viewAllLabel: z.string().max(120).optional(),
  previousLabel: z.string().max(120).optional(),
  nextLabel: z.string().max(120).optional()
};

const productSchema = z.object({
  id: z.string().min(1).max(120),
  title: textValueSchema,
  priceCurrent: textValueSchema,
  priceOriginal: textValueSchema.optional(),
  unitPrice: textValueSchema.optional(),
  ranking: textValueSchema.optional(),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: textValueSchema.optional(),
  soldCount: textValueSchema.optional(),
  countdown: textValueSchema.optional(),
  href: z.string().min(1).max(240),
  image: assetPathSchema.optional(),
  imageAlt: z.string().max(240).optional(),
  brand: textValueSchema.optional(),
  brandHref: z.string().max(240).optional(),
  addButtonAriaLabel: z.string().max(160).optional(),
}).strict().superRefine((value, context) => {
  if ((value.image && !value.imageAlt) || (!value.image && value.imageAlt)) {
    context.addIssue({ code: "custom", message: "image and imageAlt must be provided together" });
  }
  if ((value.brand && !value.brandHref) || (!value.brand && value.brandHref)) {
    context.addIssue({ code: "custom", message: "brand and brandHref must be provided together" });
  }
});

const dividerSchema = {
  dividerPosition: z.enum(["top", "bottom", "none"]).optional(),
  dividerVariant: z.enum(["gray", "black"]).optional(),
};

export const CompleteHomeSectionPropsSchemas = {
  products: z.object({
    title: textValueSchema,
    products: z.array(productSchema).min(1).max(24),
    mobileTitle: textValueSchema.optional(),
    appearance: z.literal("standard").optional(),
    layout: z.enum(["rail", "waterfall"]).optional(),
    mobileSurface: z.enum(["card", "plain"]).optional(),
    viewAllHref: z.string().max(240).optional(),
    viewAllLabel: textValueSchema.optional(),
    previousLabel: z.string().max(120).optional(),
    nextLabel: z.string().max(120).optional(),
    hasMore: z.boolean().optional(),
    loadMoreLabel: textValueSchema.optional(),
    loading: z.boolean().optional(),
    loadingLabel: z.string().max(120).optional(),
    skeletonCount: z.number().int().min(1).max(24).optional(),
    ...dividerSchema,
  }).strict(),
  brands: z.object({
    title: textValueSchema,
    campaigns: z.array(z.object({
      id: z.string().min(1).max(120),
      title: textValueSchema,
      href: z.string().max(240).optional(),
      banner: z.object({ src: assetPathSchema, alt: z.string().max(240), badgeSrc: assetPathSchema.optional(), badgeAlt: z.string().max(240).optional() }).strict(),
      products: z.array(productSchema).min(1).max(12),
    }).strict()).min(1).max(8),
    mobileTitle: textValueSchema.optional(),
    viewAllHref: z.string().max(240).optional(),
    viewAllLabel: textValueSchema.optional(),
    previousLabel: z.string().max(120).optional(),
    nextLabel: z.string().max(120).optional(),
    ...dividerSchema,
  }).strict(),
  social: z.object({
    title: textValueSchema,
    cards: z.array(z.object({
      id: z.string().min(1).max(120),
      posterSrc: assetPathSchema,
      posterAlt: z.string().max(240),
      username: textValueSchema,
      platformIconSrc: assetPathSchema,
      caption: textValueSchema,
      href: z.string().max(240).optional(),
      additionalProductCount: z.number().int().min(0).max(999).optional(),
      products: z.array(z.object({ id: z.string().min(1).max(120), imageSrc: assetPathSchema, imageAlt: z.string().max(240), title: textValueSchema.optional(), href: z.string().max(240).optional() }).strict()).max(12).optional(),
    }).strict()).min(1).max(12),
    mobileTitle: textValueSchema.optional(),
    viewAllHref: z.string().max(240).optional(),
    viewAllLabel: textValueSchema.optional(),
    previousLabel: z.string().max(120).optional(),
    nextLabel: z.string().max(120).optional(),
  }).strict(),
  billboard: z.object({
    image: z.object({
      src: assetPathSchema,
      alt: z.string().max(240),
      width: z.number().int().positive().max(10000).optional(),
      height: z.number().int().positive().max(10000).optional(),
      mobile: z.object({ src: assetPathSchema, width: z.number().int().positive().max(10000).optional(), height: z.number().int().positive().max(10000).optional() }).strict().optional(),
    }).strict(),
    href: z.string().min(1).max(240),
    label: z.string().min(1).max(160),
    imageLoading: z.enum(["eager", "lazy"]).optional(),
  }).strict(),
  searches: z.object({
    title: textValueSchema,
    keywords: z.array(z.object({
      id: z.string().min(1).max(120),
      keyword: z.string().min(1).max(120),
      href: z.string().min(1).max(240),
      tagline: textValueSchema.optional(),
      thumbnail: z.object({ src: assetPathSchema, alt: z.string().max(240) }).strict().optional(),
      products: z.array(productSchema).min(1).max(12),
      exploreLabel: textValueSchema.optional(),
    }).strict()).min(1).max(12),
    mobileTitle: textValueSchema.optional(),
    seeAllLabel: textValueSchema.optional(),
    previousLabel: z.string().max(120).optional(),
    nextLabel: z.string().max(120).optional(),
    defaultExpandedId: z.string().max(120).optional(),
  }).strict(),
} as const;

const sectionPatchSchemas = [
  z.object({ id: z.string().min(1), kind: z.literal("products"), hidden: z.boolean().optional(), props: z.object({ ...sharedSectionProps, products: CompleteHomeSectionPropsSchemas.products.shape.products.optional(), appearance: z.enum(["standard", "themed", "atmospheric"]).optional(), layout: z.enum(["rail", "waterfall"]).optional(), mobileSurface: z.enum(["card", "plain"]).optional(), loadMoreLabel: z.string().max(120).optional() }).strict().optional() }).strict(),
  z.object({ id: z.string().min(1), kind: z.literal("brands"), hidden: z.boolean().optional(), props: z.object({ ...sharedSectionProps, campaigns: CompleteHomeSectionPropsSchemas.brands.shape.campaigns.optional() }).strict().optional() }).strict(),
  z.object({ id: z.string().min(1), kind: z.literal("social"), hidden: z.boolean().optional(), props: z.object({ ...sharedSectionProps, cards: CompleteHomeSectionPropsSchemas.social.shape.cards.optional() }).strict().optional() }).strict(),
  z.object({ id: z.string().min(1), kind: z.literal("billboard"), hidden: z.boolean().optional(), props: z.object({ href: z.string().max(240).optional(), label: z.string().max(160).optional() }).strict().optional() }).strict(),
  z.object({ id: z.string().min(1), kind: z.literal("searches"), hidden: z.boolean().optional(), props: z.object({ ...sharedSectionProps, keywords: CompleteHomeSectionPropsSchemas.searches.shape.keywords.optional(), seeAllLabel: z.string().max(120).optional(), defaultExpandedId: z.string().max(120).optional() }).strict().optional() }).strict()
] as const;

export const HomeSectionPatchSchema = z.discriminatedUnion("kind", sectionPatchSchemas);
export const HomePageOverlaySchema = z.object({
  header: headerPatchSchema.optional(), hero: heroPatchSchema.optional(), shortcutRail: shortcutPatchSchema.optional(), footer: footerPatchSchema.optional(),
  sectionOrder: z.array(z.string().min(1)).optional(), sections: z.array(HomeSectionPatchSchema).optional(), tokenOverrides: TokenOverridesSchema.optional()
}).strict();

export const DirectionManifestV1Schema = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1).max(80).regex(/^[a-z0-9][a-z0-9-]*$/), name: z.string().min(1).max(80), description: z.string().max(400).optional(), extends: z.literal("current"),
  pages: z.object({ home: HomePageOverlaySchema.optional() }).strict(),
  generated: z.object({ model: z.string().min(1), createdAt: z.string().datetime() }).strict().optional()
}).strict();

export type DirectionManifestV1 = z.infer<typeof DirectionManifestV1Schema>;
export type HomePageOverlay = z.infer<typeof HomePageOverlaySchema>;
export type HomeSectionPatch = z.infer<typeof HomeSectionPatchSchema>;
