import { useMemo } from 'react'
import * as d3 from 'd3'

/**
 * D3Gauge — Medidor de arco radial limpio y plano (Estilo shadcn/ui)
 * Líneas sólidas, fondo neutro plano, sin degradados ni resplandores.
 */
export default function D3Gauge({
  value = 50,
  min = 0,
  max = 100,
  size = 170,
  strokeWidth = 10,
  label = 'Score',
  unit = '%',
  colorScheme = 'risk', // 'risk' (verde/amarillo/rojo) o 'neutral'
}) {
  const { bgArc, fillArc, arcColor } = useMemo(() => {
    const clamped = Math.min(Math.max(value, min), max)
    const ratio = (clamped - min) / (max - min || 1)

    const startAngle = -Math.PI * 0.75
    const endAngle = Math.PI * 0.75
    const currentAngle = startAngle + ratio * (endAngle - startAngle)

    const radius = size / 2 - strokeWidth

    const arcGen = d3.arc()
      .innerRadius(radius - strokeWidth / 2)
      .outerRadius(radius + strokeWidth / 2)
      .cornerRadius(strokeWidth / 2)

    const bg = arcGen({
      startAngle,
      endAngle,
    })

    const fill = arcGen({
      startAngle,
      endAngle: currentAngle,
    })

    let color = '#fafafa'
    if (colorScheme === 'risk') {
      if (ratio < 0.35) color = '#10b981' // Verde sólido
      else if (ratio < 0.65) color = '#f59e0b' // Amarillo sólido
      else color = '#ef4444' // Rojo sólido
    }

    return {
      bgArc: bg,
      fillArc: fill,
      arcColor: color
    }
  }, [value, min, max, size, strokeWidth, colorScheme])

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.8}`} className="overflow-visible">
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {/* Fondo neutro sólido */}
          <path d={bgArc} fill="#27272a" />
          {/* Valor actual sólido */}
          <path d={fillArc} fill={arcColor} />
        </g>
      </svg>

      {/* Lectura numérica central */}
      <div className="absolute top-[32%] flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100 tracking-tight">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-xs text-zinc-500 font-mono">{unit}</span>
        </div>
        <span className="text-[11px] uppercase tracking-wider font-medium text-zinc-400 mt-0.5">
          {label}
        </span>
      </div>
    </div>
  )
}
