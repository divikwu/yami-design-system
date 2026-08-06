'use client'

/**
 * Footer — YAMI PC global site footer.
 *
 * Mirrors the YAMI UI/UX Guidelines Figma Footer variants
 * (`6970:69276`, `6970:69581`, `6970:69886`), a three-band landmark:
 *
 *   Band 1 — responsive masthead
 *            1920/1440 · link grid beside the newsletter/app bands
 *            1024      · full-width link grid above two side-by-side bands
 *            all panels use --surface-secondary and 1px structural dividers
 *   Band 2 — fixed dark closing bar: payment marks, copyright, legal links
 *            (unchanged when the surrounding page switches to dark theme)
 *
 * PC only, laid out desktop-first — the mobile footer stacks differently and
 * ships as its own component.
 *
 * Destinations are optional throughout: production routes every entry through
 * the CMS, so `href` follows the Header convention and an omitted one renders
 * a plain unlinked label.
 *
 * See meta.json for the structured spec, usage.md for narrative.
 */

import { FooterAppButton } from './FooterAppButton'
import styles from './Footer.module.css'
import { FooterSubscribe } from './FooterSubscribe'
import type { FooterProps } from './Footer.types'

export function Footer({
  columns,
  subscribe,
  socialLinks = [],
  appTitle,
  appLinks = [],
  copyright,
  legalLinks = [],
  paymentMarks = [],
  ariaLabel = 'YAMI',
  socialLabel = 'Follow YAMI',
  legalLabel = 'Legal',
  paymentLabel = 'Accepted payment methods',
  className,
  ...rest
}: FooterProps) {
  const hasKeepInTouch = Boolean(subscribe) || socialLinks.length > 0
  const hasAppBand = Boolean(appTitle) || appLinks.length > 0

  return (
    <footer
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      data-slot="footer"
      {...rest}
    >
      <div className={styles.masthead} data-slot="footer-masthead">
        <div className={styles.linkPanel} data-slot="footer-link-panel">
          {columns.map((column) => (
            <div key={column.id} className={styles.column} data-slot="footer-column">
              {column.groups.map((group) => (
                <div key={group.id} className={styles.group} data-slot="footer-group">
                  <h3 className={styles.groupTitle} data-slot="footer-group-title">
                    {group.title}
                  </h3>
                  <ul className={styles.groupList}>
                    {group.links.map((link) => (
                      <li key={link.id}>
                        <a
                          className={styles.groupLink}
                          href={link.href}
                          data-slot="footer-link"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.sidePanel} data-slot="footer-side-panel">
          {hasKeepInTouch ? (
            <section className={styles.keepInTouch} data-slot="footer-keep-in-touch">
              {subscribe ? (
                <h2 className={styles.sideTitle} data-slot="footer-side-title">
                  {subscribe.title}
                </h2>
              ) : null}

              {socialLinks.length > 0 ? (
                <ul
                  className={styles.socialRow}
                  aria-label={socialLabel}
                  data-slot="footer-social"
                >
                  {socialLinks.map((social) => (
                    <li key={social.id}>
                      <a
                        className={styles.socialLink}
                        href={social.href}
                        aria-label={social.label}
                        data-slot="footer-social-link"
                      >
                        <span
                          className={styles.socialIcon}
                          style={{
                            ['--footer-social-icon' as string]: `url("${social.icon.src}")`,
                          }}
                          data-slot="footer-social-icon"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}

              {subscribe ? <FooterSubscribe {...subscribe} /> : null}
            </section>
          ) : null}

          {hasAppBand ? (
            <section className={styles.appBand} data-slot="footer-app-band">
              {appTitle ? (
                <h2 className={styles.appTitle} data-slot="footer-app-title">
                  {appTitle}
                </h2>
              ) : null}
              {appLinks.length > 0 ? (
                <div className={styles.appRow} data-slot="footer-app-row">
                  {appLinks.map((app) => (
                    <FooterAppButton
                      key={app.id}
                      href={app.href}
                      label={app.label}
                      icon={app.icon}
                      data-store={app.id}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      <div
        className={styles.closingBar}
        data-has-legal={legalLinks.length > 0 ? 'true' : undefined}
        data-slot="footer-closing-bar"
      >
        {paymentMarks.length > 0 ? (
          <ul
            className={styles.paymentRow}
            aria-label={paymentLabel}
            data-slot="footer-payments"
          >
            {paymentMarks.map((mark) => (
              <li key={mark.id}>
                <img
                  className={styles.paymentMark}
                  src={mark.icon.src}
                  alt={mark.label}
                  data-slot="footer-payment-mark"
                />
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.copyright} data-slot="footer-copyright">
          {Array.isArray(copyright)
            ? copyright.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)
            : <p>{copyright}</p>}
        </div>

        {legalLinks.length > 0 ? (
          <ul className={styles.legalRow} aria-label={legalLabel} data-slot="footer-legal">
            {legalLinks.map((legal) => (
              <li key={legal.id}>
                <a
                  className={styles.legalLink}
                  href={legal.href}
                  aria-label={legal.ariaLabel}
                  data-slot="footer-legal-link"
                >
                  {legal.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  )
}
