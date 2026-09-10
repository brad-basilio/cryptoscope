import { useState, useMemo } from 'react'
import { router, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import D3Sparkline from '@/Components/D3Sparkline'
import D3Gauge from '@/Components/D3Gauge'
import {
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaBolt,
  FaFishFins,
  FaShieldHalved,
  FaXmark,
  FaFire,
  FaCoins
} from 'react-icons/fa6'

const CATEGORIES = [
  { value: '', label: 'Activos principales' },
  { value: 'defi', label: 'DeFi' },
  { value: 'layer-1', label: 'Layer 1' },
  { value: 'ai-big-data', label: 'AI & Data' },
  { value: 'memes', label: 'Memes' },
  { value: 'real-world-assets', label: 'RWA' },
]

const STRATEGY_PRESETS = [
  { id: 'all', label: 'Todos', desc: 'Sin filtro' },
  { id: 'bullish', label: 'Alta Probabilidad Alcista', icon: FaArrowTrendUp, desc: 'Score cuantitativo > 65%' },
  { id: 'breakout', label: 'Breakouts 24h', icon: FaBolt, desc: 'Subida >3% con volumen' },
  { id: 'whales', label: 'Foco Ballenas', icon: FaFishFins, desc: 'Vol/Mcap > 15% (anomalía)' },
  { id: 'safe_supply', label: 'Baja Dilución', icon: FaShieldHalved, desc: '>80% suministro en circulación' },
]

function fmtUsd(n) {
  if (n == null) return '—'
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(5)}`
}

function fmtNum(n) {
  if (n == null || n === 0) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

export default function Screener({
  coins = [],
  trendingCoins = [],
  macroStatus = {},
  callLog = [],
  activeTag = '',
  activeSort = 'market_cap'
}) {
  const [query, setQuery] = useState('')
  const [preset, setPreset] = useState('all')
  const [sortKey, setSortKey] = useState('market_cap')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedCoin, setSelectedCoin] = useState(null)

  // Acciones rápidas dentro del modal
  const [holdingAmount, setHoldingAmount] = useState('')
  const [alertTarget, setAlertTarget] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Filtrado y Ordenamiento
  const filteredCoins = useMemo(() => {
    let list = coins.filter(c => {
      const q = query.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    })

    if (preset === 'bullish') {
      list = list.filter(c => (c.prediction?.score || 0) >= 65)
    } else if (preset === 'breakout') {
      list = list.filter(c => (c.change_24h ?? 0) >= 3 && (c.vol_mcap_ratio ?? 0) >= 0.05)
    } else if (preset === 'whales') {
      list = list.filter(c => (c.vol_mcap_ratio ?? 0) >= 0.15)
    } else if (preset === 'safe_supply') {
      list = list.filter(c => (c.circulating_pct || 0) >= 80)
    }

    list.sort((a, b) => {
      let av = a[sortKey] ?? 0
      let bv = b[sortKey] ?? 0
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (bv > av ? 1 : -1)
    })

    return list
  }, [coins, query, preset, sortKey, sortDir])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function handleTagChange(tag) {
    router.get('/screener', { tag, sort: activeSort }, { preserveState: false })
  }

  function quickAddHolding(coin) {
    if (!holdingAmount) return
    router.post('/portfolio/holdings', {
      symbol: coin.symbol,
      amount: parseFloat(holdingAmount),
      cost_basis: coin.price || 0,
    }, {
      onSuccess: () => {
        setActionSuccess(`Posición agregada: ${coin.symbol}`)
        setHoldingAmount('')
        setTimeout(() => setActionSuccess(''), 3000)
      }
    })
  }

  function quickCreateAlert(coin) {
    if (!alertTarget) return
    const isAbove = parseFloat(alertTarget) > (coin.price || 0)
    router.post('/alerts', {
      symbol: coin.symbol,
      direction: isAbove ? 'above' : 'below',
      target: parseFloat(alertTarget),
    }, {
      onSuccess: () => {
        setActionSuccess(`Alerta creada para ${coin.symbol} en $${alertTarget}`)
        setAlertTarget('')
        setTimeout(() => setActionSuccess(''), 3000)
      }
    })
  }

  return (
    <AppLayout callLog={callLog}>
      <Head title="Screener de Oportunidades" />

      {/* Top Section Inspirada en CoinMarketCap: Market Status, Miedo y Codicia, Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {/* Card 1: Market Status (Miedo/Codicia + Capitalización) */}
        <div className="shadcn-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-semibold text-zinc-200">Market Status</span>
            <span className="text-[11px] font-mono text-zinc-500">CoinMarketCap Official</span>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Medidor Miedo y Codicia oficial de CMC */}
            <div className="flex flex-col items-center justify-center">
              <D3Gauge
                value={macroStatus.fear_greed || 71}
                min={0}
                max={100}
                size={130}
                strokeWidth={8}
                label={macroStatus.fear_greed_label || 'Codicia'}
                unit=""
                colorScheme="risk"
              />
              <span className="text-[10px] text-zinc-400 font-mono mt-1">Miedo y Codicia</span>
            </div>

            {/* Cap de Mercado Global + Temporada de Altcoins */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block">Capitalización de mercado</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-mono font-semibold text-zinc-100 text-sm">
                    {fmtUsd(macroStatus.total_market_cap)}
                  </span>
                  {macroStatus.market_cap_change_24h != null && (
                    <span className={`text-[10px] font-mono font-semibold ${
                      macroStatus.market_cap_change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {macroStatus.market_cap_change_24h >= 0 ? '▲' : '▼'} {Math.abs(macroStatus.market_cap_change_24h).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/60">
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Temporada de Altcoins</span>
                  <span className="font-mono text-zinc-200">{macroStatus.altseason_index != null ? macroStatus.altseason_index : 38} / 100</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${macroStatus.altseason_index != null ? macroStatus.altseason_index : 38}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Monedas en Tendencia (Datos oficiales de CoinMarketCap) */}
        <div className="shadcn-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <FaFire className="text-amber-400 text-xs" />
              <span className="text-xs font-semibold text-zinc-200">Monedas en tendencia</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">CMC Trending Live</span>
          </div>

          <div className="divide-y divide-zinc-800/50">
            {trendingCoins.slice(0, 5).map((coin, idx) => (
              <div
                key={coin.id}
                onClick={() => setSelectedCoin(coin)}
                className="py-1 flex items-center justify-between hover:bg-zinc-900/50 px-1 rounded cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-500 w-3">{idx + 1}</span>
                  <img
                    src={coin.logo}
                    alt={coin.symbol}
                    className="w-4 h-4 rounded-full bg-zinc-800 shrink-0"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  <span className="text-xs font-semibold text-zinc-200 font-mono">{coin.symbol}</span>
                  <span className="text-[11px] text-zinc-500 truncate max-w-[90px]">{coin.name}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-zinc-200">{fmtUsd(coin.price)}</span>
                  <span className={`ml-2 text-[11px] font-semibold ${
                    (coin.change_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(coin.change_24h ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(coin.change_24h ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Métricas de Liquidez & Dominancia BTC */}
        <div className="shadcn-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-semibold text-zinc-200">Liquidez & Macro</span>
            <span className="text-[11px] font-mono text-zinc-500">CMC Pro API</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/60">
              <span className="text-zinc-400 text-[11px]">Volumen Total 24h</span>
              <span className="text-zinc-100 font-semibold">{fmtUsd(macroStatus.total_volume_24h)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/60">
              <span className="text-zinc-400 text-[11px]">Dominancia BTC / ETH</span>
              <span className="text-amber-400 font-semibold">
                {macroStatus.btc_dominance ? macroStatus.btc_dominance.toFixed(1) : '—'}% BTC
                {macroStatus.eth_dominance ? ` · ${macroStatus.eth_dominance.toFixed(1)}% ETH` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/60">
              <span className="text-zinc-400 text-[11px]">Activos Monitoreados</span>
              <span className="text-zinc-200">{coins.length} criptoactivos en vivo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleTagChange(cat.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTag === cat.value
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre o símbolo..."
            className="w-full shadcn-input px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2 text-xs text-zinc-500 hover:text-zinc-200"
            >
              <FaXmark />
            </button>
          )}
        </div>
      </div>

      {/* Preset Strategy Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1">Filtros Cuantitativos:</span>
        {STRATEGY_PRESETS.map(p => {
          const IconComp = p.icon
          return (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                preset === p.id
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              {IconComp && <IconComp className="text-[11px]" />}
              <span>{p.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Table Inspirada en CoinMarketCap con Logos Oficiales y Curva D3 Real */}
      <div className="shadcn-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/40 text-[11px] font-mono uppercase text-zinc-400 select-none">
                <th className="py-3 px-3 w-8 text-center text-zinc-500">#</th>
                <th className="py-3 px-3 cursor-pointer hover:text-zinc-100" onClick={() => handleSort('name')}>
                  Nombre {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-zinc-100" onClick={() => handleSort('price')}>
                  Precio {sortKey === 'price' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-zinc-100" onClick={() => handleSort('change_1h')}>
                  1h % {sortKey === 'change_1h' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-zinc-100" onClick={() => handleSort('change_24h')}>
                  24h % {sortKey === 'change_24h' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-zinc-100" onClick={() => handleSort('change_7d')}>
                  7d % {sortKey === 'change_7d' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-zinc-100" onClick={() => handleSort('market_cap')}>
                  Cap. de Mercado {sortKey === 'market_cap' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-zinc-100" onClick={() => handleSort('volume_24h')}>
                  Volumen (24h) {sortKey === 'volume_24h' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-zinc-100" onClick={() => handleSort('circulating_supply')}>
                  Suministro Circulante {sortKey === 'circulating_supply' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3 text-center">Precio % (7d) Real D3</th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-zinc-100" onClick={() => handleSort('prediction')}>
                  Pronóstico
                </th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredCoins.map((coin) => {
                const isGain24 = (coin.change_24h ?? 0) >= 0
                const isGain7d = (coin.change_7d ?? 0) >= 0
                const isGain1h = (coin.change_1h ?? 0) >= 0
                const pred = coin.prediction || { score: 50, sentiment: 'NEUTRAL' }

                return (
                  <tr
                    key={coin.id}
                    className="hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCoin(coin)}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center text-zinc-500 font-mono text-[11px]">
                      {coin.cmc_rank || '—'}
                    </td>

                    {/* Logo Oficial + Nombre + Símbolo */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={coin.logo}
                          alt={coin.symbol}
                          className="w-6 h-6 rounded-full bg-zinc-800 shrink-0 object-contain"
                          onError={e => {
                            e.target.onerror = null
                            e.target.src = 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-100">{coin.name}</span>
                            <span className="font-mono text-[11px] text-zinc-400 font-bold">{coin.symbol}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Precio */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-zinc-100">
                      {fmtUsd(coin.price)}
                    </td>

                    {/* 1h % */}
                    <td className="py-3 px-3 text-right font-mono text-[11px]">
                      <span className={`inline-flex items-center gap-1 justify-end ${isGain1h ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain1h ? <FaArrowTrendUp className="text-[10px]" /> : <FaArrowTrendDown className="text-[10px]" />}
                        <span>{Math.abs(coin.change_1h || 0).toFixed(2)}%</span>
                      </span>
                    </td>

                    {/* 24h % */}
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span className={`inline-flex items-center gap-1 justify-end ${isGain24 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain24 ? <FaArrowTrendUp className="text-[10px]" /> : <FaArrowTrendDown className="text-[10px]" />}
                        <span>{Math.abs(coin.change_24h || 0).toFixed(2)}%</span>
                      </span>
                    </td>

                    {/* 7d % */}
                    <td className="py-3 px-3 text-right font-mono text-[11px]">
                      <span className={`inline-flex items-center gap-1 justify-end ${isGain7d ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain7d ? <FaArrowTrendUp className="text-[10px]" /> : <FaArrowTrendDown className="text-[10px]" />}
                        <span>{Math.abs(coin.change_7d || 0).toFixed(2)}%</span>
                      </span>
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-3 text-right font-mono text-zinc-200">
                      {fmtUsd(coin.market_cap)}
                    </td>

                    {/* Volume 24h */}
                    <td className="py-3 px-3 text-right font-mono text-zinc-300">
                      {fmtUsd(coin.volume_24h)}
                    </td>

                    {/* Suministro en Circulación con Barra (Como en el screenshot de CMC) */}
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="flex flex-col items-end">
                        <span className="text-zinc-200 text-[11px]">
                          {fmtNum(coin.circulating_supply)} {coin.symbol}
                        </span>
                        {coin.max_supply > 0 && (
                          <div className="w-20 bg-zinc-800 h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-zinc-400 h-full"
                              style={{ width: `${coin.circulating_pct}%` }}
                              title={`${coin.circulating_pct}% del suministro máximo emitido`}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Curva Real 7d — Sparkline oficial de CoinMarketCap */}
                    <td className="py-3 px-3 text-center">
                      <img
                        src={coin.cmc_sparkline}
                        alt={`${coin.symbol} 7d`}
                        className="inline-block h-[26px] w-[95px] object-contain"
                        style={{ filter: isGain7d ? 'hue-rotate(85deg) saturate(1.8) brightness(1.2)' : 'hue-rotate(330deg) saturate(2) brightness(1.1)' }}
                        onError={e => {
                          // Fallback a D3 si CDN falla
                          e.target.style.display = 'none'
                          e.target.nextSibling && (e.target.nextSibling.style.display = 'inline-block')
                        }}
                      />
                      <span style={{ display: 'none' }}>
                        <D3Sparkline
                          data={coin.sparkline}
                          isPositive={isGain7d}
                          width={95}
                          height={26}
                          strokeWidth={1.4}
                        />
                      </span>
                    </td>

                    {/* Pronóstico Cuantitativo (Motor Predictivo) */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        pred.sentiment === 'BULLISH'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : pred.sentiment === 'BEARISH'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {pred.score}% {pred.sentiment === 'BULLISH' ? 'Alcista' : pred.sentiment === 'BEARISH' ? 'Riesgo' : 'Neutro'}
                      </span>
                    </td>

                    {/* Botón Acción */}
                    <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCoin(coin)}
                        className="shadcn-btn-outline px-2 py-1 text-[11px]"
                      >
                        Detalles
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Deep-Dive con Análisis Predictivo Completo */}
      {selectedCoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 transition-opacity"
            onClick={() => setSelectedCoin(null)}
          />

          <div className="relative bg-[#0c0c0e] border border-zinc-800 rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCoin.logo}
                  alt={selectedCoin.symbol}
                  className="w-9 h-9 rounded-full bg-zinc-800 object-contain shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-zinc-100">{selectedCoin.name}</h3>
                    <span className="text-xs font-mono font-bold text-zinc-400">({selectedCoin.symbol})</span>
                    <span className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300 px-1.5 py-0.2 rounded">
                      Rank #{selectedCoin.cmc_rank}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    CMC ID: #{selectedCoin.id} · Cotización en USD
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCoin(null)}
                className="text-zinc-400 hover:text-zinc-100 text-sm p-1"
              >
                <FaXmark />
              </button>
            </div>

            {/* Price & Real Historical Curve */}
            <div className="grid grid-cols-2 gap-4 my-4">
              <div>
                <span className="text-xs text-zinc-400 font-mono uppercase">Precio Actual</span>
                <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                  {fmtUsd(selectedCoin.price)}
                </div>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs">
                  <span className={(selectedCoin.change_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    24h: {(selectedCoin.change_24h ?? 0) >= 0 ? '+' : ''}{selectedCoin.change_24h?.toFixed(2)}%
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className={(selectedCoin.change_7d ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    7d: {(selectedCoin.change_7d ?? 0) >= 0 ? '+' : ''}{selectedCoin.change_7d?.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center">
                <span className="text-[11px] text-zinc-500 mb-1 font-mono">Curva Real 7d (CMC Pro)</span>
                <img
                  src={selectedCoin.cmc_sparkline}
                  alt={`${selectedCoin.symbol} 7d`}
                  className="h-[40px] w-[160px] object-contain"
                  style={{ filter: (selectedCoin.change_7d ?? 0) >= 0 ? 'hue-rotate(85deg) saturate(1.8) brightness(1.2)' : 'hue-rotate(330deg) saturate(2) brightness(1.1)' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>
            </div>

            {/* Evaluador Predictivo: ¿Subirá o Bajará? */}
            <div className={`p-3.5 rounded-md border text-xs mb-4 ${
              selectedCoin.prediction?.sentiment === 'BULLISH'
                ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                : selectedCoin.prediction?.sentiment === 'BEARISH'
                  ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">
                  Evaluación Cuantitativa: {selectedCoin.prediction?.label} ({selectedCoin.prediction?.score}%)
                </span>
                <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-black/40">
                  {selectedCoin.prediction?.sentiment}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                {selectedCoin.prediction?.explanation}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 text-[10px] font-mono text-zinc-400">
                <div>
                  <span className="text-zinc-500 block">Suministro en Mercado:</span>
                  <span className="text-zinc-200 font-semibold">{selectedCoin.circulating_pct}% emitido</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Riesgo Dilución:</span>
                  <span className={selectedCoin.circulating_pct > 75 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {selectedCoin.circulating_pct > 75 ? 'Bajo' : 'Alto (Desbloqueos)'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Ratio Vol/Cap:</span>
                  <span className="text-zinc-200 font-semibold">{((selectedCoin.vol_mcap_ratio ?? 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5">
              {actionSuccess && (
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                  {actionSuccess}
                </div>
              )}

              {/* Add to Portfolio */}
              <div className="p-3 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-medium text-zinc-200 block">Registrar en Portafolio</span>
                  <span className="text-[11px] text-zinc-500">Costo base: {fmtUsd(selectedCoin.price)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Cantidad"
                    value={holdingAmount}
                    onChange={e => setHoldingAmount(e.target.value)}
                    className="shadcn-input px-2 py-1 text-xs w-24"
                  />
                  <button
                    onClick={() => quickAddHolding(selectedCoin)}
                    className="shadcn-btn-primary px-3 py-1 text-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              {/* Add Alert */}
              <div className="p-3 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-medium text-zinc-200 block">Fijar Alerta de Precio</span>
                  <span className="text-[11px] text-zinc-500">Aviso sonoro y push al cruzar</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Precio USD"
                    value={alertTarget}
                    onChange={e => setAlertTarget(e.target.value)}
                    className="shadcn-input px-2 py-1 text-xs w-24"
                  />
                  <button
                    onClick={() => quickCreateAlert(selectedCoin)}
                    className="shadcn-btn-secondary px-3 py-1 text-xs"
                  >
                    Crear Alerta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
