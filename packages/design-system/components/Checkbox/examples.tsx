import { Checkbox } from "./Checkbox"

export const BasicCheckbox = () => (
  <section data-example="BasicCheckbox">
    <label htmlFor="marketing-email">
      <Checkbox id="marketing-email" name="marketing" value="email" />
      Email deals · 邮件优惠
    </label>
  </section>
)
export const SelectedCheckbox = () => (
  <section data-example="SelectedCheckbox">
    <Checkbox aria-label="Selected option" defaultChecked />
  </section>
)

export const DisabledCheckbox = () => (
  <section data-example="DisabledCheckbox">
    <Checkbox aria-label="Unavailable option" disabled />
  </section>
)

export const IndeterminateCheckbox = () => (
  <section data-example="IndeterminateCheckbox">
    <Checkbox aria-label="Some items selected" indeterminate />
  </section>
)
