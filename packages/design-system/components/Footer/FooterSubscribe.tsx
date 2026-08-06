'use client'

/**
 * FooterSubscribe — the newsletter field in the "keep in touch" band.
 *
 * Split out of Footer because it is the only stateful slot in the landmark;
 * everything else in Footer is static content. Validation is deliberately the
 * caller's concern — the component surfaces `error` and fires `onSubmit`, so
 * the DS never bakes in an email regex or a marketing endpoint.
 */

import { useState } from 'react'

import styles from './Footer.module.css'
import type { FooterSubscribeProps } from './Footer.types'

export function FooterSubscribe({
  label,
  placeholder,
  submitLabel,
  value,
  onValueChange,
  onSubmit,
  error,
}: FooterSubscribeProps) {
  const [uncontrolled, setUncontrolled] = useState('')
  const current = value ?? uncontrolled

  function handleChange(next: string) {
    if (value === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  return (
    <form
      className={styles.subscribe}
      data-slot="footer-subscribe"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.(current)
      }}
    >
      <label className={styles.subscribeLabel} htmlFor="footer-subscribe-email">
        {label}
      </label>
      <div className={styles.subscribeRow}>
        <input
          id="footer-subscribe-email"
          className={styles.subscribeInput}
          data-slot="footer-subscribe-input"
          type="email"
          name="email"
          autoComplete="email"
          placeholder={placeholder}
          value={current}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'footer-subscribe-error' : undefined}
          onChange={(event) => handleChange(event.target.value)}
        />
        <button
          className={styles.subscribeSubmit}
          data-slot="footer-subscribe-submit"
          type="submit"
        >
          {submitLabel}
        </button>
      </div>
      {error ? (
        <p
          id="footer-subscribe-error"
          className={styles.subscribeError}
          data-slot="footer-subscribe-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  )
}
