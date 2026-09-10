import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import D3Gauge from '@/Components/D3Gauge'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const PALETTE = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981']

function fmtUsd(n) {
  if (n == null) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

export default function MarketPulse({ metrics = {}, callLog = [] }) {
  const btcDom = metrics.btc_dominance ?? 0
  const ethDom = metrics.eth_dominance ?? 0
  const othersDom = Math.max(0, 100 - btcDom - ethDom)

  const dominanceData = [
    { name: 'Bitcoin (BTC)', value: btcDom },
    { name: 'Ethereum (ETH)', value: ethDom },
    { name: 'Altcoins (Resto)', value: othersDom },
  ]

  const totalCap = metrics.total_market_cap || 1
  const totalVol = metrics.total_volume_24h || 0
  const velocityPct = ((totalVol / totalCap) * 100).toFixed(2)

  let cycleDiagnosis = {
    title: 'Fase de Dominancia Bitcoin (Refugio)',
    desc: 'Los inversores priorizan la seguridad de BTC. Momento común de acumulación antes de rotar liquidez.',
    badge: 'Acumulación Macro',
    color: 'text-amber-400',
  }

  if (btcDom < 45) {
    cycleDiagnosis = {
      title: 'Temporada de Altcoins (Altseason)',
      desc: 'El capital rota activamente hacia Ethereum y activos de menor capitalización.',
      badge: 'Altseason Activa',
      color: 'text-emerald-400',
    }
  } else if (btcDom >= 45 && btcDom <= 54) {
    cycleDiagnosis = {
      title: 'Mercado en Transición Equilibrada',
      desc: 'Flujo balanceado entre Bitcoin y las principales altcoins del mercado.',
      badge: 'Consolidación',
      color: 'text-zinc-200',
    }
  }

  return (
    <AppLayout callLog={callLog}>
      <Head title="Global Market Pulse" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Global Market Pulse
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Termómetro macroeconómico global del mercado cripto. Indicadores de ciclo y liquidez.
          </p>
        </div>
      </div>

      {/* Guide Card */}
      <div className="shadcn-card p-4 mb-5 text-xs text-zinc-300 space-y-1.5 border-zinc-800">
        <p className="font-semibold text-zinc-100">
          Guía Rápida de Indicadores Macro
        </p>
        <p className="text-zinc-400 leading-relaxed text-[11px]">
          <strong>Dominancia BTC ({btcDom.toFixed(1)}%):</strong> Representa qué porcentaje del valor total del mercado está en Bitcoin. Por encima del 55% indica búsqueda de refugio; por debajo del 45% señala inicio de Altseason.
        </p>
        <p className="text-zinc-400 leading-relaxed text-[11px]">
          <strong>Velocidad de Liquidez ({velocityPct}%):</strong> Relación entre el volumen negociado en 24h y la capitalización total del mercado.
        </p>
      </div>

      {/* Cycle Banner */}
      <div className="shadcn-panel p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase text-zinc-400">Estado de Ciclo:</span>
            <span className={`text-[10px] font-mono font-medium px-2 py-0.2 rounded bg-zinc-900 border border-zinc-800 ${cycleDiagnosis.color}`}>
              {cycleDiagnosis.badge}
            </span>
          </div>
          <h3 className={`text-base font-semibold ${cycleDiagnosis.color}`}>
            {cycleDiagnosis.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {cycleDiagnosis.desc}
          </p>
        </div>

        <div className="text-right shrink-0 font-mono text-xs text-zinc-500">
          Actualizado: {metrics.last_updated ? new Date(metrics.last_updated).toLocaleTimeString() : 'En vivo'}
        </div>
      </div>

      {/* Macro Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="shadcn-card p-4">
          <span className="text-xs text-zinc-400 font-medium">Market Cap Total</span>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            {fmtUsd(metrics.total_market_cap)}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">Todas las criptomonedas</p>
        </div>

        <div className="shadcn-card p-4">
          <span className="text-xs text-zinc-400 font-medium">Volumen Global 24h</span>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            {fmtUsd(metrics.total_volume_24h)}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">Spot y derivados combinados</p>
        </div>

        <div className="shadcn-card p-4">
          <span className="text-xs text-zinc-400 font-medium">Velocidad de Liquidez</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {velocityPct}%
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">Volumen / Cap Total</p>
        </div>

        <div className="shadcn-card p-4">
          <span className="text-xs text-zinc-400 font-medium">Activos Monitoreados</span>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {metrics.active_cryptocurrencies?.toLocaleString()}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">
            En {metrics.active_exchanges?.toLocaleString()} exchanges
          </p>
        </div>
      </div>

      {/* D3 Gauge & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* D3 Gauge */}
        <div className="shadcn-panel p-5 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-xs uppercase font-mono tracking-wider text-zinc-200">
                Dominancia de Bitcoin
              </h4>
              <p className="text-xs text-zinc-400">Porcentaje de liquidez global</p>
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-100 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {btcDom.toFixed(1)}% BTC
            </span>
          </div>

          <div className="my-3">
            <D3Gauge
              value={btcDom}
              min={30}
              max={70}
              size={210}
              strokeWidth={12}
              label="Dominancia"
              unit="%"
              colorScheme="neutral"
            />
          </div>

          <div className="w-full grid grid-cols-3 gap-2 text-center text-[10px] font-mono border-t border-zinc-800 pt-3 text-zinc-400">
            <div>
              <span className="text-zinc-500 block">&lt; 45%</span>
              <span className="text-emerald-400 font-medium">Altseason</span>
            </div>
            <div>
              <span className="text-zinc-500 block">45% - 55%</span>
              <span className="text-zinc-300 font-medium">Balance</span>
            </div>
            <div>
              <span className="text-zinc-500 block">&gt; 55%</span>
              <span className="text-amber-400 font-medium">BTC Refugio</span>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="shadcn-panel p-5 flex flex-col justify-between">
          <div className="mb-2">
            <h4 className="font-semibold text-xs uppercase font-mono tracking-wider text-zinc-200">
              Distribución de Capital
            </h4>
            <p className="text-xs text-zinc-400">Participación por activo principal</p>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dominanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dominanceData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="#09090b" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={v => [`${Number(v).toFixed(2)}%`, 'Participación']}
                  contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 font-mono text-xs text-center">
            <div>
              <span className="text-amber-400 font-bold block">{btcDom.toFixed(1)}%</span>
              <span className="text-[10px] text-zinc-400">Bitcoin</span>
            </div>
            <div>
              <span className="text-blue-400 font-bold block">{ethDom.toFixed(1)}%</span>
              <span className="text-[10px] text-zinc-400">Ethereum</span>
            </div>
            <div>
              <span className="text-purple-400 font-bold block">{othersDom.toFixed(1)}%</span>
              <span className="text-[10px] text-zinc-400">Resto</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
