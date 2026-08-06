import { RadioGroup, RadioGroupItem } from "./RadioGroup"

export const PaymentMethodRadioGroup = () => (
  <section data-example="PaymentMethodRadioGroup">
    <RadioGroup name="payment-method" defaultValue="card">
      <label>
        <RadioGroupItem value="card" />
        Card · 银行卡
      </label>
      <label>
        <RadioGroupItem value="apple-pay" />
        Apple Pay
      </label>
    </RadioGroup>
  </section>
)
export const DisabledRadioGroup = () => (
  <section data-example="DisabledRadioGroup">
    <RadioGroup aria-label="Unavailable payment methods" defaultValue="card" disabled>
      <RadioGroupItem aria-label="Card" value="card" />
      <RadioGroupItem aria-label="Apple Pay" value="apple-pay" />
    </RadioGroup>
  </section>
)

export const ControlledRadioGroup = () => (
  <section data-example="ControlledRadioGroup">
    <RadioGroup aria-label="Delivery speed" value="standard" onValueChange={() => undefined}>
      <RadioGroupItem aria-label="Standard" value="standard" />
      <RadioGroupItem aria-label="Express" value="express" />
    </RadioGroup>
  </section>
)
