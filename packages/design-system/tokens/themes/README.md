# `tokens/themes/` — theme coordination

YAMI ships Light and Dark themes from one semantic contract:

- `tokens/semantic/colors.tokens.json` is the Light value set emitted under `:root`.
- `dark.tokens.json` has exact semantic-color key parity and is emitted under `.dark`.
- Primitive tokens stay unchanged across themes.

Apply Dark globally or to a subtree:

```html
<html class="dark">
```

```tsx
<section className="dark">…</section>
```

`inverse` is not a theme. It means the opposite surface polarity inside the
active theme. Light and Dark both provide default and inverse semantic values:

| Theme | Default surface | Inverse surface |
|---|---|---|
| Light | light | dark |
| Dark | dark | light |

When changing semantic colors, update both source files. The token resolver
rejects missing or extra Dark keys, and `pnpm build:tokens` regenerates
`tokens.json`, `tokens.css`, `tokens.md`, `tokens.ts`, and `tokens.flat.json`.
