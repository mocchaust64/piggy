import React, { useMemo } from 'react'
import { View, ViewStyle } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

interface SparklineProps {
  data: number[]
  width: number
  height: number
  color?: string
  strokeWidth?: number
  style?: ViewStyle
}

/**
 * A professional, high-fidelity Sparkline component using SVG.
 * Renders a smooth trend line with a subtle gradient fill.
 */
export function Sparkline({
  data,
  width,
  height,
  color = '#D4001A',
  strokeWidth = 2,
  style,
}: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 2

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - ((val - min) / range) * (height - padding * 2) - padding
      return { x, y }
    })

    // Create a smooth SVG path string using cubic bezier (simple version)
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cpX = (p0.x + p1.x) / 2
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`
    }

    return d
  }, [data, width, height])

  const areaPath = useMemo(() => {
    if (!path) return ''
    return `${path} L ${width} ${height} L 0 ${height} Z`
  }, [path, width, height])

  if (data.length < 2) return <View style={[{ width, height }, style]} />

  return (
    <View style={style}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Fill Area */}
        <Path d={areaPath} fill="url(#gradient)" />

        {/* Line */}
        <Path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}
