import { Footer } from './Footer'
import {
  createFooterAppLinks,
  createFooterColumns,
  createFooterLegalLinks,
  createFooterPaymentMarks,
  createFooterSocialLinks,
  footerCopy,
} from './fixtures'

/** The full PC footer, as it ships on the EN storefront. */
export function PcFooter() {
  const copy = footerCopy.en
  return (
    <Footer
      ariaLabel={copy.ariaLabel}
      columns={createFooterColumns('en')}
      socialLinks={createFooterSocialLinks('en')}
      subscribe={{
        title: copy.subscribeTitle,
        label: copy.subscribeLabel,
        placeholder: copy.subscribePlaceholder,
        submitLabel: copy.subscribeSubmit,
      }}
      appTitle={copy.appTitle}
      appLinks={createFooterAppLinks()}
      copyright={copy.copyright}
      legalLinks={createFooterLegalLinks('en')}
      paymentMarks={createFooterPaymentMarks()}
    />
  )
}

/** Link columns only — the newsletter and app bands are both optional. */
export function MinimalFooter() {
  return (
    <Footer
      columns={createFooterColumns('en')}
      copyright={footerCopy.en.copyright}
      legalLinks={createFooterLegalLinks('en')}
    />
  )
}
