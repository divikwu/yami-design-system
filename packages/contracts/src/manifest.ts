import { z } from "zod";
import { TokenOverridesSchema } from "./tokens";

const linkSchema = z.object({ label: z.string().max(120), href: z.string().max(240).optional() }).strict();
const headerPatchSchema = z.object({
  homeHref: z.string().max(240).optional(),
  searchPlaceholder: z.string().max(120).optional(),
  ariaLabel: z.string().max(120).optional(),
  account: linkSchema.optional(),
  cart: z.object({ label: z.string().max(120), href: z.string().max(240).optional(), count: z.number().int().min(0).max(999).optional() }).strict().optional()
}).strict();
const heroPatchSchema = z.object({
  ariaLabel: z.string().max(120).optional(), previousLabel: z.string().max(120).optional(), nextLabel: z.string().max(120).optional(), autoAdvance: z.boolean().optional(), autoAdvanceInterval: z.number().min(3).max(30).optional()
}).strict();
const shortcutPatchSchema = z.object({ ariaLabel: z.string().max(120).optional(), previousLabel: z.string().max(120).optional(), nextLabel: z.string().max(120).optional(), lines: z.union([z.literal(1), z.literal(2)]).optional() }).strict();
const footerPatchSchema = z.object({ appTitle: z.string().max(160).optional(), ariaLabel: z.string().max(120).optional(), socialLabel: z.string().max(120).optional(), legalLabel: z.string().max(120).optional() }).strict();

const sharedSectionProps = {
  title: z.string().max(160).optional(),
  mobileTitle: z.string().max(160).optional(),
  viewAllHref: z.string().max(240).optional(),
  viewAllLabel: z.string().max(120).optional(),
  previousLabel: z.string().max(120).optional(),
  nextLabel: z.string().max(120).optional()
};

const textValueSchema = z.union([z.string().max(240), z.number().finite()]);
const assetPathSchema = z.string().max(500).refine(
  (value) => /^\/(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\\]*$/.test(value),
  "Assets must use an emitted same-origin path",
);
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
  z.object({ id: z.string().min(1), kind: z.literal("products"), hidden: z.boolean().optional(), props: z.object({ ...sharedSectionProps, appearance: z.enum(["standard", "themed", "atmospheric"]).optional(), layout: z.enum(["rail", "waterfall"]).optional(), loadMoreLabel: z.string().max(120).optional() }).strict().optional() }).strict(),
  z.object({ id: z.string().min(1), kind: z.literal("brands"), hidden: z.boolean().optional(), props: z.object(sharedSectionProps).strict().optional() }).strict(),
  z.object({ id: z.string().min(1), kind: z.literal("social"), hidden: z.boolean().optional(), props: z.object(sharedSectionProps).strict().optional() }).strict(),
  z.object({ id: z.string().min(1), kind: z.literal("billboard"), hidden: z.boolean().optional(), props: z.object({ href: z.string().max(240).optional(), label: z.string().max(160).optional() }).strict().optional() }).strict(),
  z.object({ id: z.string().min(1), kind: z.literal("searches"), hidden: z.boolean().optional(), props: z.object({ ...sharedSectionProps, seeAllLabel: z.string().max(120).optional(), defaultExpandedId: z.string().max(120).optional() }).strict().optional() }).strict()
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
