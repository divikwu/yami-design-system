# Writing Standards

Structural rules for YAMI content writing. All copy must follow these patterns regardless of surface (web, app, email, support).

## Three layers of writing

When writing a new rule, section, or help doc, follow this structure:

### 1. Summary — what it does

First sentence: the outcome in plain language. What does this thing accomplish for the user?

Wrong: "This section discusses the mechanism by which coupon codes are applied..."
Right: "Coupon codes reduce your subtotal at checkout."

### 2. Definition — what it covers / what it doesn't

Second paragraph: scope. What's included, what's excluded, what happens at the edges.

Wrong: "This may or may not work with certain items."
Right: "Coupons apply to food and beverage items. They do NOT stack with loyalty discounts, and they do NOT apply to shipping fees."

### 3. Rules — exactly how

Remaining content: specific rules, ordered. Use numbered lists.

Wrong: "Try to enter the code before submitting."
Right: "1. Enter the code in the Promo Code field. 2. Click Apply. 3. The discount appears as a separate line in your order summary."

## Hard rules

- **Never write "this section / this document"** — write the noun directly
  - Wrong: "This section defines coupon rules"
  - Right: "Coupon rules:"
- **Summary answers "what does it do"**
- **Definition answers "what it covers / what it doesn't"**
- **Rules answer "exactly how"**
- **Use 必须 / 不得 / 可以** in zh-CN, "must / must not / may" in en-US
  - Not: "尽量", "建议", "最好" — these leave interpretation to the reader
  - Not: "should", "recommended", "preferred" — same problem

## Verb discipline

- **Present tense** for rules: "Apply within 30 days" not "Should be applied within 30 days"
- **Imperative** for CTAs: "Apply", "Submit", "Return"
- **Active voice**: "The system charges your card" not "Your card is charged"

## Length discipline

- **Buttons / labels**: 1-4 words
- **Empty states**: 1 sentence what happened + 1 sentence next action
- **Error messages**: 1 sentence what went wrong + 1 sentence what to do
- **Confirmations**: 1 sentence result + optional 1 sentence next steps

If you can't say it in the above, the content design is wrong, not the copy.

## Reading level

Target **6th grade reading level** in both English and Chinese. Simple sentences, concrete nouns, everyday verbs.

The goal: a 60-year-old grandmother shopping for her grandchildren should be able to read every label without stopping to think.

## Anti-patterns

Don't write:
- "In order to..." → "To..."
- "Please note that..." → (delete, just state the note)
- "Thank you for your patience" → (delete, or fix the actual delay)
- "We're sorry, but..." → (delete, just say what happened)
- "Oops!" / "Uh-oh!" → (delete, just say what failed)

## Reference

- `voice.md` — voice/tone attributes
- `bilingual.md` — CN + EN parity
- `copy-patterns.md` — signature pattern library
- `casing-numerals.md` — mechanics
