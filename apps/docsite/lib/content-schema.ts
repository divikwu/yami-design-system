import { z } from "zod";

import { docGroups } from "./docs-navigation";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const docFrontmatterSchema = z.object({
  slug,
  title: z.string().min(1),
  description: z.string().min(1),
  group: z.enum(docGroups),
  order: z.number().int().nonnegative(),
  keywords: z.array(z.string().min(1)).min(1),
  updatedAt: isoDate,
  sourceRefs: z.array(z.string().min(1)).min(1),
  draft: z.boolean().optional().default(false),
});

export const blogFrontmatterSchema = z.object({
  slug,
  title: z.string().min(1),
  description: z.string().min(1),
  date: isoDate,
  updatedAt: isoDate.optional(),
  category: z.enum(["update", "design", "engineering"]),
  authors: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).max(4),
  relatedDocs: z.array(slug).optional().default([]),
  cover: z.object({
    src: z.string().startsWith("/"),
    eyebrow: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
  }).optional(),
  coverAlt: z.string().optional(),
  draft: z.boolean().optional().default(false),
});

export type DocFrontmatter = z.infer<typeof docFrontmatterSchema>;
export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;
