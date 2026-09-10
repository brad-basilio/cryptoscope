import { useMemo } from 'react'
import * as d3 from 'd3'

/**
 * D3Sparkline — Micro-gráfico minimalista con D3.js (Estilo shadcn/ui)
 * Línea vectorial sólida sin degradados ni resplandores artificiales.
 */
export default function D3Sparkline({
  data = [],
  width = 110,
  height = 28,
  isPositive = true,
  strokeWidth = 1.5
}) {
  const pathData = useMemo(() => {
    const points = data && data.length > 2
      ? data
      : isPositive
        ? [10, 10.8, 10.4, 11.5, 11.2, 12.8, 13.2]
        : [13.2, 12.6, 13.0, 11.8, 12.1, 11.0, 10.2]

    const padding = 2
    const minVal = d3.min(points) ?? 0
    const maxVal = d3.max(points) ?? 1
    const range = maxVal - minVal || 1

    const xScale = d3.scaleLinear()
      .domain([0, points.length - 1])
      .range([padding, width - padding])

    const yScale = d3.scaleLinear()
      .domain([minVal - range * 0.1, maxVal + range * 0.1])
      .range([height - padding, padding])

    const lineGenerator = d3.line()
      .x((_, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX)

    return lineGenerator(points)
  }, [data, width, height, isPositive])

  // Color plano sólido sin degradados
  const strokeColor = isPositive ? '#10b981' : '#ef4444'

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      {pathData && (
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
