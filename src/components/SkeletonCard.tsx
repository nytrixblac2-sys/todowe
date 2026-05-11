import { C } from '../theme'

function Skeleton({ height, width = '100%', radius = 10, style }: {
  height: number
  width?: string | number
  radius?: number
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      height,
      width,
      borderRadius: radius,
      background: `linear-gradient(90deg, ${C.card} 25%, ${C.surface} 50%, ${C.card} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }} />
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: C.surface, borderRadius: 18, padding: '14px 16px',
      marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton height={20} width="55%" radius={8} />
        <Skeleton height={22} width={72} radius={11} />
      </div>
      <Skeleton height={8} radius={4} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton height={14} width="35%" radius={6} />
        <div style={{ display: 'flex', gap: -6 }}>
          {[0, 1].map(i => (
            <Skeleton key={i} height={24} width={24} radius={12}
              style={{ marginLeft: i > 0 ? -8 : 0 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonLoader() {
  return (
    <div style={{ paddingTop: 6 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 42, flexShrink: 0 }}>
            <Skeleton height={14} width={32} radius={4} style={{ marginTop: 28, marginLeft: 'auto' }} />
          </div>
          <div style={{ flex: 1 }}>
            <SkeletonCard />
          </div>
        </div>
      ))}
    </div>
  )
}
