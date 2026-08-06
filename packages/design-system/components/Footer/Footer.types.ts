import type { ComponentProps, ReactNode } from 'react'

/** An image slot. Social glyphs and app-store badge artwork are both images. */
export interface FooterImage {
  src: string
  alt: string
}

/**
 * One entry inside a link column.
 *
 * `href` is optional and follows the Header convention — omit it while
 * navigation is not configured and the anchor renders as a plain, unlinked
 * label. Production routes every entry through the CMS, so the DS never
 * hardcodes destinations.
 */
export interface FooterLink {
  id: string
  label: string
  href?: string
}

/** A titled group of links, e.g. `About Yami`. */
export interface FooterLinkColumn {
  id: string
  /** Visible group heading, rendered as an `h3` inside the footer landmark. */
  title: string
  links: FooterLink[]
}

/**
 * One visual masthead column. The Figma PC variants use four visual columns;
 * the last column owns the Make Money and Contact groups.
 */
export interface FooterColumn {
  id: string
  groups: FooterLinkColumn[]
}

/** A social follow entry in the "keep in touch" band. */
export interface FooterSocialLink {
  id: string
  /** Localized accessible name, e.g. "Facebook". The glyph is decorative. */
  label: string
  icon: FooterImage
  href?: string
}

/** An app-store download entry. */
export interface FooterAppLink {
  id: string
  /** Visible label and accessible name, e.g. "App Store". */
  label: string
  /**
   * Store badge artwork rendered at 24px. Supplied by the caller so the
   * official Apple / Google marks stay out of the DS bundle.
   */
  icon?: FooterImage
  href?: string
}

/** A legal entry in the closing bar, e.g. `Privacy Policy`. */
export interface FooterLegalLink {
  id: string
  label: string
  href?: string
  /**
   * Longer accessible name when the visible label under-describes the target —
   * production's "Business license" opens a bare image file.
   */
  ariaLabel?: string
}

/** A payment mark in the closing bar. Decorative artwork with an accessible name. */
export interface FooterPaymentMark {
  id: string
  label: string
  icon: FooterImage
}

export type FooterCopyright = string | readonly string[]

export interface FooterSubscribeProps {
  /** Section heading above the social row, e.g. "Let's keep in touch". */
  title: string
  /** Localized accessible name for the email field. */
  label: string
  placeholder?: string
  /** Visible label for the submit control. */
  submitLabel: string
  /** Controlled value. Leave undefined for an uncontrolled field. */
  value?: string
  onValueChange?: (value: string) => void
  /** Fires on submit with the current value. Validation is the caller's concern. */
  onSubmit?: (email: string) => void
  /** Rendered below the field when the caller rejects the submission. */
  error?: string
}

export interface FooterAppButtonProps extends Omit<ComponentProps<'a'>, 'children'> {
  /** Visible label and accessible name, e.g. "App Store". */
  label: string
  /** Store badge artwork rendered at 24px. Omit for a label-only button. */
  icon?: FooterImage
  /** Escape hatch for callers supplying an inline SVG mark instead of an image. */
  children?: ReactNode
}

export interface FooterProps extends Omit<ComponentProps<'footer'>, 'children' | 'title'> {
  /** Masthead columns, in display order. The PC fixture supplies four. */
  columns: FooterColumn[]

  /** Newsletter block. Omit to drop the whole "keep in touch" band. */
  subscribe?: FooterSubscribeProps
  /** Social follow entries rendered above the newsletter field. */
  socialLinks?: FooterSocialLink[]

  /** Heading for the app band, e.g. "Shop on the go. Get the app." */
  appTitle?: string
  /** App-store download entries. Omit to drop the app band. */
  appLinks?: FooterAppLink[]

  /** Copyright copy, either one line or the Figma four-paragraph form. */
  copyright: FooterCopyright
  /** Legal entries rendered beside the copyright line. */
  legalLinks?: FooterLegalLink[]
  /** Accepted payment marks rendered above the copyright line. */
  paymentMarks?: FooterPaymentMark[]

  /** Localized accessible name for the contentinfo landmark. */
  ariaLabel?: string
  /** Localized accessible name for the social follow list. */
  socialLabel?: string
  /** Localized accessible name for the legal link list. */
  legalLabel?: string
  /** Localized accessible name for the payment mark list. */
  paymentLabel?: string
}
