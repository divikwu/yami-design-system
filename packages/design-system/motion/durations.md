# Motion Durations

Minimal duration tiers. Faster is better unless physics demands otherwise.

## Duration scale

| Token | Value | Use for |
|---|---|---|
| `--duration-instant` | 0ms | State reconciliation that should feel synchronous (focus ring, tab switch) |
| `--duration-fast` | 100ms | Micro-interactions (hover color change, button press feedback) |
| `--duration-base` | 150ms | Default state changes (modal open/close, dropdown show, menu expand) |
| `--duration-medium` | 200ms | Complex state changes with multiple properties animating |
| `--duration-slow` | 300ms | Page transitions, hero content reveal |
| `--duration-crawl` | 500ms | Rare — hero scroll-reveal or celebratory micro-moments |

## Which to use when

**Rule of thumb**: if it fires more than once per second of typical interaction, it should be 150ms or faster. If it fires rarely (page navigation), 300ms is acceptable.

- **Button hover**: 100ms (`--duration-fast`)
- **Button press**: 100ms
- **Input focus border**: 100ms
- **Dropdown open**: 150ms
- **Modal open/close**: 150ms
- **Tab switch**: 0-100ms
- **Toast appear**: 150ms
- **Toast dismiss**: 200ms (slightly slower gives user time to read before it goes)
- **Page transition**: 300ms
- **Hero image reveal** (rare, on-scroll): 500ms

## Anti-patterns

- ❌ Any animation > 500ms in frequent interactions (feels sluggish)
- ❌ Staggered children animations > 100ms between items (feels slow)
- ❌ Hover animations > 200ms (feels "gummy")
- ❌ Different durations for show vs hide without reason (consistent is default)

## Enforcement

No rule-ids yet in `../design.md` for durations. Future candidate:
- `motion-duration-from-token` — `transition-duration` must use one of the 6 token values
