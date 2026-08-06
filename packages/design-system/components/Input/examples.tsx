/**
 * Input — canonical examples.
 */

import { Input } from './Input'

export const BasicInput = () => (
  <section data-example="BasicInput">
    <Input label="Label" />
  </section>
)

export const FocusedInput = () => (
  <section data-example="FocusedInput">
    <Input label="Label" state="focused" />
  </section>
)

export const TypingInput = () => (
  <section data-example="TypingInput">
    <Input label="Label" defaultValue="Input" state="typing" clearable />
  </section>
)

export const CompleteInput = () => (
  <section data-example="CompleteInput">
    <Input label="Label" defaultValue="Input" state="complete" />
  </section>
)

export const WithErrorInput = () => (
  <section data-example="WithErrorInput">
    <Input label="Label" defaultValue="Input" error="Supporting text" />
  </section>
)

export const DisabledFilledInput = () => (
  <section data-example="DisabledFilledInput">
    <Input label="Label" defaultValue="Input" disabled />
  </section>
)

export const DisabledEmptyInput = () => (
  <section data-example="DisabledEmptyInput">
    <Input label="Label" disabled />
  </section>
)

export const SearchInput = () => (
  <section data-example="SearchInput">
    <Input type="search" aria-label="Search" placeholder="Search YAMI" fullWidth />
  </section>
)

export const RequiredInput = () => (
  <section data-example="RequiredInput">
    <Input label="Phone" type="tel" required />
  </section>
)

export const WithHelperTextInput = () => (
  <section data-example="WithHelperTextInput">
    <Input label="Phone" type="tel" helperText="We'll text you order updates." />
  </section>
)

export const ResettableInput = () => (
  <section data-example="ResettableInput">
    <form>
      <Input label="Label" />
      <button type="reset">Reset</button>
    </form>
  </section>
)
