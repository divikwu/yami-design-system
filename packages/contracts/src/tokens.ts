import { z } from "zod";

export const allowedTokenIds = [
  "--surface-primary", "--surface-secondary", "--surface-inverse",
  "--text-primary", "--text-secondary", "--text-emphasis", "--text-on-emphasis",
  "--border-default", "--border-focus", "--color-brand-red",
  "--space-100", "--space-150", "--space-200", "--space-300", "--space-400",
  "--radius-component-default", "--radius-surface-default",
  "--font-weight-normal", "--font-weight-emphasize"
] as const;

export const AllowedTokenIdSchema = z.enum(allowedTokenIds);
export type AllowedTokenId = z.infer<typeof AllowedTokenIdSchema>;

const tokenReference = /^\{[a-z0-9.-]+\}$/i;
const color = /^(#[0-9a-f]{6}|#[0-9a-f]{8})$/i;
const dimension = /^(0|(?:0(?:\.\d+)?|[1-9]\d?(?:\.\d+)?)(?:px|rem))$/;

export const TokenOverrideValueSchema = z.string().superRefine((value, context) => {
  if (/[;{}]|url\s*\(|calc\s*\(/i.test(value)) {
    context.addIssue({ code: "custom", message: "CSS statements and functions are forbidden" });
    return;
  }
  if (!color.test(value) && !dimension.test(value) && !tokenReference.test(value) && !["400", "600"].includes(value)) {
    context.addIssue({ code: "custom", message: "Unsupported token override value" });
  }
});

export type TokenOverrideValue = z.infer<typeof TokenOverrideValueSchema>;

export const TokenOverridesSchema = z.partialRecord(AllowedTokenIdSchema, TokenOverrideValueSchema).superRefine((overrides, context) => {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || tokenReference.test(value)) continue;
    const valid = key.startsWith("--font-weight-")
      ? ["400", "600"].includes(value)
      : key.startsWith("--space-") || key.startsWith("--radius-")
        ? dimension.test(value)
        : color.test(value);
    if (!valid) context.addIssue({ code: "custom", path: [key], message: `Value does not match the token type for ${key}` });
  }
});
