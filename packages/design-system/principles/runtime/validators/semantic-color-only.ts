/**
 * semantic-color-only (runtime) — resolved colors must not contain
 * non-semantic raw color values (blue/green/purple/yellow used decoratively).
 *
 * P2 stub — returns pass. Full implementation requires mapping resolved
 * computed colors back to their semantic intent, which needs the token
 * resolution chain from Phase 8.5.
 */

// TODO: Phase 8.5 — implement runtime check
// Strategy: getComputedStyle color/backgroundColor on all elements,
// identify non-neutral hues (blue/green/purple/yellow), verify they
// map to semantic status or badge palette tokens.

import type { RuntimeValidator } from '../schema'

export const semanticColorOnly: RuntimeValidator = {
  ruleId: 'semantic-color-only',
  title: '语义色限制',
  severity: 'error',
  check(_root) {
    // TODO: Phase 8.5 — implement runtime check
    return []
  },
}
