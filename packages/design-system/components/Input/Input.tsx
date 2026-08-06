/**
 * Input — YAMI single-line form field.
 *
 * Mirrors Figma `↪ 表单输入 Forms` / `Input Field`:
 *   - responsive platform sizing: Mobile 48px, PC 56px
 *   - embedded label, value row, optional clear action
 *   - states: default, focused, typing, complete, error, disabled-filled, disabled-empty
 *
 * Behavior is intentionally native-input based: ref forwarding, controlled
 * and uncontrolled values, keyboard focus, disabled, required, aria-invalid,
 * and aria-describedby are all preserved.
 */

import {
  type ChangeEvent,
  forwardRef,
  type FocusEvent,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import styles from './Input.module.css'

export type InputState =
  | 'default'
  | 'focused'
  | 'typing'
  | 'complete'
  | 'error'
  | 'disabled'
  | 'disabled-filled'
  | 'disabled-empty'

export type InputSize = 'responsive' | 'md' | 'lg'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Embedded field label from the YAMI Figma component. */
  label?: ReactNode
  /** Supporting text below the field. Hidden when error is present. */
  helperText?: ReactNode
  /** Error message. Sets aria-invalid and renders the red supporting text. */
  error?: ReactNode
  /**
   * Visual state override for catalog stories and controlled demos.
   * Product code usually lets focus/value/error/disabled derive the state.
   */
  state?: InputState
  /** @deprecated Figma Input is responsive rather than size-tiered. Kept for backward compatibility. */
  size?: InputSize
  /** Leading icon or text inside the field. Prefer currentColor SVGs from assets/icons. */
  leadingIcon?: ReactNode
  /** Trailing icon, text, or action inside the field. Prefer currentColor SVGs from assets/icons. */
  trailingIcon?: ReactNode
  /** Backward-compatible alias for leadingIcon. */
  prefix?: ReactNode
  /** Backward-compatible alias for trailingIcon. */
  suffix?: ReactNode
  /** Shows the Figma clear-fill action while focus remains inside a field with a value. */
  clearable?: boolean
  /** Called after the clear action dispatches a native input event. Controlled callers may also clear value here. */
  onClear?: () => void
  /** Stretches root to 100% of the container. */
  fullWidth?: boolean
  /** Optional hint rendered inside the embedded label. */
  optional?: boolean
}

function valueText(value: InputProps['value'] | InputProps['defaultValue']): string {
  if (value == null) return ''
  return String(value)
}

function isDisabledState(state: InputState | undefined): boolean {
  return state === 'disabled' || state === 'disabled-filled' || state === 'disabled-empty'
}

function ClearFillIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.9999 2C17.5227 2 21.9999 6.47715 21.9999 12C21.9999 17.5228 17.5227 22 11.9999 22C6.47703 22 1.99988 17.5228 1.99988 12C1.99988 6.47715 6.47703 2 11.9999 2ZM11.9999 10.9395L8.28796 7.22656L7.22644 8.28809L10.9393 12L7.22644 15.7119L8.28796 16.7734L11.9999 13.0605L15.7118 16.7734L16.7733 15.7119L13.0604 12L16.7733 8.28809L15.7118 7.22656L11.9999 10.9395Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ErrorCloseIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 10.9393L18.5407 4.3986L19.6014 5.45926L13.0606 12L19.6014 18.5407L18.5407 19.6014L12 13.0607L5.45925 19.6014L4.39859 18.5407L10.9393 12L4.39859 5.45926L5.45925 4.3986L12 10.9393Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    helperText,
    error,
    state,
    size = 'responsive',
    leadingIcon,
    trailingIcon,
    prefix,
    suffix,
    clearable = false,
    onClear,
    fullWidth = false,
    optional = false,
    required,
    disabled,
    className,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    'aria-describedby': ariaDescribedBy,
    'aria-label': ariaLabel,
    placeholder,
    ...rest
  },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const helperId = `${inputId}-helper`
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement | null>(null)

  const isControlled = value !== undefined
  const [textValue, setTextValue] = useState(() => valueText(value ?? defaultValue))
  const [focused, setFocused] = useState(false)

  const syncTextValueFromInput = useCallback(() => {
    const input = inputRef.current
    if (!input) return
    setTextValue(valueText(input.value))
  }, [])

  useEffect(() => {
    if (isControlled) setTextValue(valueText(value))
  }, [isControlled, value])

  useEffect(() => {
    if (isControlled) return undefined

    const input = inputRef.current
    if (!input) return undefined

    input.addEventListener('input', syncTextValueFromInput)
    input.addEventListener('change', syncTextValueFromInput)

    return () => {
      input.removeEventListener('input', syncTextValueFromInput)
      input.removeEventListener('change', syncTextValueFromInput)
    }
  }, [isControlled, syncTextValueFromInput])

  useEffect(() => {
    if (isControlled) return undefined

    const input = inputRef.current
    const form = input?.form
    if (!input || !form) return undefined

    let resetFrame = 0
    const handleFormReset = () => {
      if (resetFrame) window.cancelAnimationFrame(resetFrame)
      resetFrame = window.requestAnimationFrame(syncTextValueFromInput)
    }

    form.addEventListener('reset', handleFormReset)

    return () => {
      if (resetFrame) window.cancelAnimationFrame(resetFrame)
      form.removeEventListener('reset', handleFormReset)
    }
  }, [isControlled, syncTextValueFromInput])

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  const isExplicitDisabled = isDisabledState(state)
  const isDisabled = Boolean(disabled) || isExplicitDisabled
  const hasText = textValue.length > 0
  const hasLabel = label != null
  const isError = Boolean(error) || state === 'error'

  const resolvedState: InputState = (() => {
    if (isError) return 'error'
    if (isDisabled) {
      if (state === 'disabled-empty') return 'disabled-empty'
      if (state === 'disabled-filled') return 'disabled-filled'
      return hasText ? 'disabled-filled' : 'disabled-empty'
    }
    if (state === 'focused' || state === 'typing' || state === 'complete' || state === 'default') {
      return state
    }
    if (focused && hasText) return 'typing'
    if (focused) return 'focused'
    if (hasText) return 'complete'
    return 'default'
  })()

  const isFloating =
    !hasLabel ||
    resolvedState === 'focused' ||
    resolvedState === 'typing' ||
    resolvedState === 'complete' ||
    resolvedState === 'error' ||
    resolvedState === 'disabled-filled'

  const describedBy = [ariaDescribedBy, error ? errorId : helperText ? helperId : undefined]
    .filter(Boolean)
    .join(' ') || undefined

  const startSlot = leadingIcon ?? prefix
  const endSlot = trailingIcon ?? suffix
  const showClear =
    clearable &&
    !isDisabled &&
    !endSlot &&
    hasText &&
    (resolvedState === 'typing' || state === 'typing')

  const rootClasses = [styles.root, fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setTextValue(event.currentTarget.value)
    onChange?.(event)
  }

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    onFocus?.(event)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event)
  }

  const handleClear = () => {
    const input = inputRef.current
    if (!input) return

    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    if (valueSetter) {
      valueSetter.call(input, '')
    } else {
      input.value = ''
    }
    input.dispatchEvent(new Event('input', { bubbles: true }))

    onClear?.()
    input.focus()
  }

  const handleFieldMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return
    if (event.target instanceof HTMLElement && event.target.closest('button,input,textarea,select,a')) return
    event.preventDefault()
    inputRef.current?.focus()
  }

  return (
    <div
      className={rootClasses}
      data-slot="input"
      data-state={resolvedState}
      data-size={size}
      data-filled={hasText || undefined}
      data-floating={isFloating || undefined}
      data-label={hasLabel || undefined}
      data-leading={Boolean(startSlot) || undefined}
      data-disabled={isDisabled || undefined}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <div className={styles.field} onMouseDown={handleFieldMouseDown}>
        {startSlot && <span className={styles.leading}>{startSlot}</span>}
        <div className={styles.textStack}>
          {hasLabel && (
            <label className={styles.label} htmlFor={inputId}>
              {label}
              {required && (
                <span className={styles.requiredMarker} aria-hidden="true">
                  *
                </span>
              )}
              {optional && !required && <span className={styles.optionalHint}>Optional · 选填</span>}
            </label>
          )}
          <div className={styles.valueRow}>
            <input
              {...rest}
              ref={setInputRef}
              id={inputId}
              className={styles.control}
              data-slot="input-control"
              value={value}
              defaultValue={defaultValue}
              placeholder={placeholder}
              disabled={isDisabled}
              required={required}
              aria-label={ariaLabel}
              aria-invalid={isError || undefined}
              aria-describedby={describedBy}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>
        {showClear && (
          <button
            className={styles.clearButton}
            type="button"
            aria-label="Clear input"
            onClick={handleClear}
          >
            <ClearFillIcon />
          </button>
        )}
        {endSlot && <span className={styles.trailing}>{endSlot}</span>}
      </div>
      {error ? (
        <span id={errorId} className={styles.errorText} role="alert">
          <span className={styles.errorIcon}>
            <ErrorCloseIcon />
          </span>
          <span>{error}</span>
        </span>
      ) : helperText ? (
        <span id={helperId} className={styles.helperText}>
          {helperText}
        </span>
      ) : null}
    </div>
  )
})
