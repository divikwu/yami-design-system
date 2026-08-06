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

export const GenerateDirectionRequestSchema = z.object({ prompt: z.string().min(1).max(2000), locale: z.enum(["zh", "en"]), clientId: z.string().uuid() }).strict();
export type DirectionManifestV1 = z.infer<typeof DirectionManifestV1Schema>;
export type HomePageOverlay = z.infer<typeof HomePageOverlaySchema>;
export type HomeSectionPatch = z.infer<typeof HomeSectionPatchSchema>;
export type GenerateDirectionRequest = z.infer<typeof GenerateDirectionRequestSchema>;
