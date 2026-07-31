'use client'

interface SparklineProps {
  data: number[]
  positive?: boolean
  width?: number
  height?: number
}

export function Sparkline({ data, positive, width = 80, height = 30 }: SparklineProps) {
  if (!data || data.length < 2) return <div style={{ width, height }} />

  const min = Math.min(...data)
  const max = Math.max(...data)
  const isFlat = min === max
  const range = isFlat ? 1 : max - min

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = isFlat ? height / 2 : height - ((v - min) / range) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const path = `M ${pts.join(' L ')}`
  const color = positive === false ? '#ef4444' : positive === true ? '#10b981' : '#64748b'

  // Area fill
  const areaPath = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={isFlat ? "0" : "0.2"} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
