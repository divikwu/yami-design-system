import { z } from "zod";
import { registeredTokenReferenceTypes } from "./generated-token-references";

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

const tokenReference = /^\{([a-z0-9.-]+)\}$/i;
const color = /^(#[0-9a-f]{6}|#[0-9a-f]{8})$/i;
const dimension = /^(0|(?:0(?:\.\d+)?|[1-9]\d?(?:\.\d+)?)(?:px|rem))$/;

export const TokenOverrideValueSchema = z.string().superRefine((value, context) => {
  const reference = tokenReference.exec(value)?.[1];
  if (/[;]|url\s*\(|calc\s*\(/i.test(value) || (/[{}]/.test(value) && !reference)) {
    context.addIssue({ code: "custom", message: "CSS statements and functions are forbidden" });
    return;
  }
  if (reference && !(reference in registeredTokenReferenceTypes)) {
    context.addIssue({ code: "custom", message: "Token reference is not registered" });
    return;
  }
  if (!color.test(value) && !dimension.test(value) && !reference && !["400", "600"].includes(value)) {
    context.addIssue({ code: "custom", message: "Unsupported token override value" });
  }
});

export type TokenOverrideValue = z.infer<typeof TokenOverrideValueSchema>;

export const TokenOverridesSchema = z.partialRecord(AllowedTokenIdSchema, TokenOverrideValueSchema).superRefine((overrides, context) => {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    const expectedType = key.startsWith("--font-weight-") ? "fontWeight" : key.startsWith("--space-") || key.startsWith("--radius-") ? "dimension" : "color";
    const reference = tokenReference.exec(value)?.[1];
    if (reference) {
      const referencedType = registeredTokenReferenceTypes[reference as keyof typeof registeredTokenReferenceTypes];
      const referencedCssVar = `--${reference.replaceAll(".", "-")}`;
      if (referencedType !== expectedType) context.addIssue({ code: "custom", path: [key], message: `Token reference type does not match ${key}` });
      if (referencedCssVar === key) context.addIssue({ code: "custom", path: [key], message: `Token override cannot reference itself` });
      continue;
    }
    const valid = expectedType === "fontWeight"
      ? ["400", "600"].includes(value)
      : expectedType === "dimension"
        ? dimension.test(value)
        : color.test(value);
    if (!valid) context.addIssue({ code: "custom", path: [key], message: `Value does not match the token type for ${key}` });
  }
});

export function tokenOverrideValueToCss(value: TokenOverrideValue): string {
  const reference = tokenReference.exec(value)?.[1];
  return reference ? `var(--${reference.replaceAll(".", "-")})` : value;
}

export function tokenOverridesToStyle(overrides: Partial<Record<AllowedTokenId, TokenOverrideValue>>): Record<string, string> {
  return Object.fromEntries(Object.entries(overrides).map(([key, value]) => [key, tokenOverrideValueToCss(value)]));
}
