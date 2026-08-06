import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { AspectRatio } from './AspectRatio'

const meta = {
  title: 'YAMI/Components/Layout/AspectRatio',
  component: AspectRatio,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A style-neutral layout primitive that constrains arbitrary content to a width-to-height ratio. ProductCard uses ratio={1} for its media region.',
      },
    },
  },
  args: {
    ratio: 1,
  },
} satisfies Meta<typeof AspectRatio>

export default meta
type Story = StoryObj<typeof meta>

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--space-300)',
  width: 'min(760px, 100%)',
}

const frameStyle: CSSProperties = {
  overflow: 'hidden',
  borderRadius: 'var(--radius-surface-default)',
}

const contentStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  color: 'var(--text-secondary)',
  background: 'var(--surface-secondary)',
  fontFamily: 'var(--font-family-ios)',
  fontSize: 'var(--font-size-body-md)',
  lineHeight: 'var(--line-height-body-md)',
}

function Specimen({ ratio, label }: { ratio: number; label: string }) {
  return (
    <AspectRatio ratio={ratio} style={frameStyle}>
      <div style={contentStyle}>{label}</div>
    </AspectRatio>
  )
}

export const Showcase: Story = {
  render: () => (
    <div style={gridStyle}>
      <Specimen ratio={1} label="1 : 1" />
      <Specimen ratio={16 / 9} label="16 : 9" />
      <Specimen ratio={3 / 4} label="3 : 4" />
    </div>
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 320 }}>
      <AspectRatio {...args} style={frameStyle}>
        <div style={contentStyle}>{args.ratio.toFixed(2)}</div>
      </AspectRatio>
    </div>
  ),
}
