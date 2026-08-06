import { z } from "zod";

export const canvasPaths = ["/", "/products", "/categories", "/search", "/cart", "/brands", "/account"] as const;

export const PreviewNavigateMessageSchema = z.object({
  type: z.literal("yami-canvas:v1:navigate"),
  path: z.string().max(240).regex(/^\/(?!\/)[^\\]*$/, "Preview path must be a same-origin absolute path")
}).strict().superRefine((message, context) => {
  const root = `/${message.path.split("/").filter(Boolean)[0] ?? ""}`;
  if (!canvasPaths.includes(root as (typeof canvasPaths)[number])) context.addIssue({ code: "custom", message: "Unknown preview path" });
});

export type PreviewNavigateMessage = z.infer<typeof PreviewNavigateMessageSchema>;
