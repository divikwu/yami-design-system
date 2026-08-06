import { AspectRatio } from './AspectRatio'

const mediaStyle = {
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  color: 'var(--text-secondary)',
  background: 'var(--surface-secondary)',
} as const

export function SquareAspectRatio() {
  return (
    <AspectRatio ratio={1}>
      <div style={mediaStyle}>1 : 1</div>
    </AspectRatio>
  )
}

export function LandscapeAspectRatio() {
  return (
    <AspectRatio ratio={16 / 9}>
      <div style={mediaStyle}>16 : 9</div>
    </AspectRatio>
  )
}

export function PortraitAspectRatio() {
  return (
    <AspectRatio ratio={3 / 4}>
      <div style={mediaStyle}>3 : 4</div>
    </AspectRatio>
  )
}
