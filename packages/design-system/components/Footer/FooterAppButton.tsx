'use client'

/**
 * FooterAppButton — one app-store download control.
 *
 * Split out of Footer because production renders the same 246x40 inverse pill
 * for both stores and the badge artwork is supplied per store. Keeping it
 * separate lets callers reuse the control in app-download modules outside the
 * footer without lifting the whole landmark.
 *
 * The store marks themselves stay out of the DS bundle — Apple and Google both
 * license their badges — so `icon` is a caller-supplied image slot, matching how
 * Header takes category artwork rather than baking icon components.
 */

import styles from './Footer.module.css'
import type { FooterAppButtonProps } from './Footer.types'

export function FooterAppButton({
  label,
  icon,
  children,
  imageLoading,
  className,
  ...rest
}: FooterAppButtonProps) {
  return (
    <a
      className={[styles.appButton, className].filter(Boolean).join(' ')}
      data-slot="footer-app-button"
      {...rest}
    >
      {icon ? (
        <img
          className={styles.appButtonIcon}
          src={icon.src}
          alt=""
          width={24}
          height={24}
          loading={imageLoading}
          decoding="async"
        />
      ) : null}
      {children}
      <span className={styles.appButtonLabel} data-slot="footer-app-button-label">
        {label}
      </span>
    </a>
  )
}
