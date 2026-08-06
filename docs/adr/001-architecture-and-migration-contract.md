# ADR 001 — YAMI Canvas architecture and migration contract

## Decision

YAMI Canvas uses a pnpm workspace with Next.js Canvas, React-Vite Storybook,
source-consumed React packages and a contracts-only Zod package. It does not use
Astryx Theme Adapter, StyleX, Tailwind, shadcn, Turborepo or a database.

The migrated source is locked to the SHA in `docs/migration/source-lock.json`.
Derived tokens and catalogs are regenerated in this repository.

## Direction merge contract

- `current` always comes from `createEcommerceHomeFixture(locale)`.
- Fixed slots and section props use top-level shallow merge.
- Arrays replace in full.
- Existing section ids cannot change kind.
- New sections require unique ids and complete props.
- `sectionOrder` contains every visible id exactly once.
- Functions, React elements and arbitrary HTML/CSS are not serializable.
- Navigation callbacks are rebound after manifest resolution.

The Canvas parent URL owns path, direction, locale, theme and viewport. The
preview iframe reports navigation through the versioned postMessage protocol;
it never owns application history.
