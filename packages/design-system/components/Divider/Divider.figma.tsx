/**
 * Divider.figma.tsx — Figma Code Connect binding (Phase 10).
 */

import { figma } from '@figma/code-connect'

import { Divider } from './Divider'

figma.connect(
  Divider,
  'https://www.figma.com/file/6oOAy72DBff4P6NzJYc2hi/YAMI?node-id=TBD-Divider',
  {
    props: {
      strength: figma.enum('Strength', {
        Default: 'default',
        Emphasis: 'emphasis',
      }),
      inverse: figma.boolean('Inverse'),
      orientation: figma.enum('Orientation', {
        Horizontal: 'horizontal',
        Vertical: 'vertical',
      }),
    },
    example: ({ strength, inverse, orientation }) => (
      <Divider strength={strength} inverse={inverse} orientation={orientation} />
    ),
  },
)
