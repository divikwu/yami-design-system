/**
 * Card.figma.tsx — Figma Code Connect binding (Phase 10).
 */

import { figma } from '@figma/code-connect'

import { Card } from './Card'

figma.connect(Card, 'https://www.figma.com/file/6oOAy72DBff4P6NzJYc2hi/YAMI?node-id=TBD-Card', {
  props: {
    padding: figma.enum('Padding', { None: 'none', Small: 'sm', Medium: 'md', Large: 'lg' }),
    surface: figma.enum('Surface', {
      Primary: 'primary',
      Secondary: 'secondary',
      Inverse: 'inverse',
    }),
    bordered: figma.boolean('Bordered'),
    children: figma.children('Contents'),
  },
  example: ({ padding, surface, bordered, children }) => (
    <Card padding={padding} surface={surface} bordered={bordered}>
      {children}
    </Card>
  ),
})
