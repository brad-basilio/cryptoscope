import { useState, useMemo, useEffect, useRef } from 'react'
import { router, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import D3Gauge from '@/Components/D3Gauge'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { playAlertChime, sendDesktopNotification } from '@/lib/sound'
import {
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaTrophy,
  FaTriangleExclamation,
  FaBullseye,
  FaCrosshairs,
  FaPlus,
  FaXmark,
  FaClipboardList,
  FaChartPie,
  FaCircleCheck,
  FaShieldHalved,
  FaCircleExclamation,
  FaCircleDot,
  FaTrashCan,
  FaLock
} from 'react-icons/fa6'

const PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316']

function fmtUsd(n) {
  if (n == null) return '—'
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function fmtPct(n) {
  if (n == null) return '—'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function calculateHHI(rows, totalValue) {
  if (!totalValue || rows.length === 0) return 0
  return rows.reduce((sum, r) => {
    const weight = (r.current_value || 0) / totalValue
    return sum + weight * weight * 100
  }, 0)
}

// ---------- Persistencia de targets notificados ----------
function getDismissedTargets() {
  try {
    return JSON.parse(localStorage.getItem('cs_dismissed_targets') || '[]')
  } catch { return [] }
}

function addDismissedTarget(id) {
  try {
    const current = getDismissedTargets()
    if (!current.includes(id)) {
      localStorage.setItem('cs_dismissed_targets', JSON.stringify([...current, id]))
    }
  } catch {}
}

export default function Portfolio({ rows = [], isAuthenticated = false, callLog = [] }) {
  const [form, setForm] = useState({ symbol: '', amount: '', cost_basis: '' })
  const [submitting, setSubmitting] = useState(false)
  const [stressLossPct, setStressLossPct] = useState(25)
  const [showAddModal, setShowAddModal] = useState(false)

  // Target form state
  const [targetForm, setTargetForm] = useState({ holding_id: null, type: 'take_profit', mode: 'price', value: '' })
  const [showTargetForm, setShowTargetForm] = useState(null) // holding ID or null
  const [targetSuccess, setTargetSuccess] = useState('')

  // Detail modal
  const [selectedRow, setSelectedRow] = useState(null)

  // Portfolio target toasts
  const [targetToasts, setTargetToasts] = useState([])
  const notifiedTargetsRef = useRef(new Set(getDismissedTargets()))

  // ---------- Background target monitoring ----------
  useEffect(() => {
    let isMounted = true

    async function checkPortfolioTargets() {
      try {
        const res = await fetch('/api/portfolio/check-targets')
        if (!res.ok) return
        const data = await res.json()
        if (!isMounted) return

        const triggered = data.triggered || []
        const dismissed = getDismissedTargets()
        const fresh = triggered.filter(t => !dismissed.includes(t.id) && !notifiedTargetsRef.current.has(t.id))

        if (fresh.length > 0) {
          playAlertChime()

          fresh.forEach(t => {
            notifiedTargetsRef.current.add(t.id)
            const isTP = t.type === 'take_profit'
            const label = isTP ? 'Take-Profit Alcanzado' : 'Stop-Loss Disparado'
            const body = `${t.symbol}: ${isTP ? 'Ganancia' : 'Pérdida'} de ${fmtPct(t.pnl_pct)} (${fmtUsd(t.pnl)}). Precio actual: ${fmtUsd(t.current_price)}`

            sendDesktopNotification(label, { body })

            setTargetToasts(prev => [...prev, {
              id: t.id,
              symbol: t.symbol,
              type: t.type,
              msg: body,
              pnl: t.pnl,
              pnl_pct: t.pnl_pct,
              time: new Date().toLocaleTimeString(),
            }])
          })
        }
      } catch {}
    }

    checkPortfolioTargets()
    const interval = setInterval(checkPortfolioTargets, 25000)
    return () => { isMounted = false; clearInterval(interval) }
  }, [])

  function dismissTargetToast(id) {
    addDismissedTarget(id)
    notifiedTargetsRef.current.add(id)
    setTargetToasts(prev => prev.filter(t => t.id !== id))
  }

  // ---------- Cálculos del portafolio ----------
  const totalValue = useMemo(() => rows.reduce((s, r) => s + (r.current_value || 0), 0), [rows])
  const totalCost = useMemo(() => rows.reduce((s, r) => s + (r.cost_value || 0), 0), [rows])
  const totalPnl = totalValue - totalCost
  const totalRoi = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const isWinning = totalPnl >= 0

  const hhiScore = useMemo(() => calculateHHI(rows, totalValue), [rows, totalValue])

  const maxConcentration = useMemo(() => {
    if (!totalValue || rows.length === 0) return { symbol: '', pct: 0 }
    let max = 0, maxSymbol = ''
    rows.forEach(r => {
      const pct = ((r.current_value || 0) / totalValue) * 100
      if (pct > max) { max = pct; maxSymbol = r.symbol }
    })
    return { symbol: maxSymbol, pct: max }
  }, [rows, totalValue])

  // Lógica inteligente de mejor y peor inversión
  const performers = useMemo(() => {
    const valid = rows.filter(r => r.pnl_pct != null)
    if (valid.length === 0) return { best: null, worst: null, isSingle: false }
    if (valid.length === 1) {
      return {
        single: valid[0],
        best: valid[0].pnl >= 0 ? valid[0] : null,
        worst: valid[0].pnl < 0 ? valid[0] : null,
        isSingle: true
      }
    }
    const sorted = [...valid].sort((a, b) => (b.pnl_pct || 0) - (a.pnl_pct || 0))
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      isSingle: false
    }
  }, [rows])

  const pieData = useMemo(() => {
    return rows.filter(r => (r.current_value || 0) > 0).map(r => ({ name: r.symbol, value: r.current_value }))
  }, [rows])

  const stressSurvivingValue = totalValue * (1 - stressLossPct / 100)
  const stressLossUSD = totalValue - stressSurvivingValue

  // ---------- Acciones ----------
  function submit(e) {
    e.preventDefault()
    if (!form.symbol || !form.amount || !form.cost_basis) return
    setSubmitting(true)
    router.post('/portfolio/holdings', {
      symbol: form.symbol.toUpperCase(),
      amount: parseFloat(form.amount),
      cost_basis: parseFloat(form.cost_basis),
    }, {
      onSuccess: () => {
        setShowAddModal(false)
        setForm({ symbol: '', amount: '', cost_basis: '' })
      },
      onFinish: () => {
        setSubmitting(false)
      }
    })
  }

  function removeHolding(id) {
    router.delete(`/portfolio/holdings/${id}`)
  }

  function submitTarget(e) {
    e.preventDefault()
    if (!targetForm.holding_id || !targetForm.value) return
    router.post('/portfolio/targets', {
      holding_id: targetForm.holding_id,
      type: targetForm.type,
      mode: targetForm.mode,
      value: parseFloat(targetForm.value),
    }, {
      onSuccess: () => {
        setTargetSuccess(targetForm.type === 'take_profit' ? 'Take-Profit registrado con éxito' : 'Stop-Loss registrado con éxito')
        setTargetForm({ holding_id: null, type: 'take_profit', mode: 'price', value: '' })
        setShowTargetForm(null)
        setTimeout(() => setTargetSuccess(''), 3000)
      }
    })
  }

  function removeTarget(targetId) {
    router.delete(`/portfolio/targets/${targetId}`)
  }

  return (
    <AppLayout callLog={callLog}>
      <Head title="Portfolio & Risk Engine" />

      {/* Portfolio Target Toasts */}
      <div className="fixed top-16 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {targetToasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-md p-3.5 shadow-2xl flex items-start gap-3 border ${
              toast.type === 'take_profit'
                ? 'bg-emerald-950/90 border-emerald-700'
                : 'bg-rose-950/90 border-rose-700'
            }`}
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold shrink-0 ${
              toast.type === 'take_profit'
                ? 'bg-emerald-900 text-emerald-300'
                : 'bg-rose-900 text-rose-300'
            }`}>
              {toast.type === 'take_profit' ? <FaBullseye /> : <FaShieldHalved />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-xs text-zinc-100">
                  {toast.symbol} — {toast.type === 'take_profit' ? 'Take-Profit' : 'Stop-Loss'}
                </p>
                <span className="text-[10px] font-mono text-zinc-500">{toast.time}</span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">{toast.msg}</p>
              <p className={`text-sm font-bold font-mono mt-1 ${toast.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {toast.pnl >= 0 ? 'Ganancia generada:' : 'Pérdida registrada:'} {fmtUsd(Math.abs(toast.pnl))} ({fmtPct(toast.pnl_pct)})
              </p>
            </div>
            <button onClick={() => dismissTargetToast(toast.id)} className="text-zinc-500 hover:text-zinc-200 text-xs p-1">
              <FaXmark />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Portfolio & Risk Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gestión de posiciones con PnL en tiempo real, Take-Profit / Stop-Loss automáticos y análisis de riesgo.
          </p>
        </div>
      </div>

      {/* ============ HERO: Resumen Ganando / Perdiendo ============ */}
      <div className={`shadcn-card p-5 mb-6 border-l-4 ${isWinning ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-400 font-medium">Resumen de tu Inversión</span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-bold font-mono text-zinc-100">{fmtUsd(totalValue)}</span>
              <span className={`text-lg font-bold font-mono flex items-center gap-1.5 ${isWinning ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isWinning ? <FaArrowTrendUp className="text-base" /> : <FaArrowTrendDown className="text-base" />}
                {fmtUsd(Math.abs(totalPnl))}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Invertiste {fmtUsd(totalCost)} · ROI: <span className={isWinning ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{fmtPct(totalRoi)}</span>
            </p>
          </div>

          <div className={`flex items-center gap-3 px-5 py-3 rounded-lg ${isWinning ? 'bg-emerald-950/40 border border-emerald-800/60' : 'bg-rose-950/40 border border-rose-800/60'}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isWinning ? 'bg-emerald-900/60 text-emerald-400' : 'bg-rose-900/60 text-rose-400'}`}>
              {isWinning ? <FaArrowTrendUp /> : <FaArrowTrendDown />}
            </div>
            <div>
              <p className={`text-sm font-bold ${isWinning ? 'text-emerald-300' : 'text-rose-300'}`}>
                {isWinning ? 'Rentabilidad Positiva' : 'Pérdida No Realizada'}
              </p>
              <p className="text-xs text-zinc-400">
                {isWinning
                  ? `Llevas ${fmtUsd(totalPnl)} de ganancia neta sobre tu capital invertido.`
                  : `Llevas ${fmtUsd(Math.abs(totalPnl))} de pérdida neta. No vendas en pánico.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards — Con manejo inteligente si solo hay 1 activo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Card 1: Mejor Inversión / Estado Posición */}
        <div className="shadcn-card p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <FaTrophy className="text-amber-400 text-xs" />
            <span className="text-xs font-medium">Mejor Inversión</span>
          </div>
          <div className="mt-1">
            {performers.best ? (
              <>
                <div className="flex items-center gap-2">
                  {performers.best.logo && (
                    <img src={performers.best.logo} alt={performers.best.symbol} className="w-5 h-5 rounded-full bg-zinc-800" onError={e => { e.target.style.display = 'none' }} />
                  )}
                  <span className="text-lg font-bold font-mono text-zinc-100">{performers.best.symbol}</span>
                </div>
                <p className="text-emerald-400 font-bold font-mono text-sm mt-1">
                  +{fmtUsd(performers.best.pnl)} ({fmtPct(performers.best.pnl_pct)})
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Compraste a {fmtUsd(performers.best.cost_basis)}, ahora vale {fmtUsd(performers.best.live)}
                </p>
              </>
            ) : (
              <div className="mt-2">
                <span className="text-xs text-zinc-400 font-medium block">Sin ganancias aún</span>
                <span className="text-[11px] text-zinc-500 mt-0.5 block">
                  {performers.isSingle ? 'Tu único activo está en negativo' : 'Todos tus activos están en negativo'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Peor Inversión / Rendimiento Más Bajo */}
        <div className="shadcn-card p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <FaTriangleExclamation className="text-rose-400 text-xs" />
            <span className="text-xs font-medium">Mayor Corrección</span>
          </div>
          <div className="mt-1">
            {performers.worst ? (
              <>
                <div className="flex items-center gap-2">
                  {performers.worst.logo && (
                    <img src={performers.worst.logo} alt={performers.worst.symbol} className="w-5 h-5 rounded-full bg-zinc-800" onError={e => { e.target.style.display = 'none' }} />
                  )}
                  <span className="text-lg font-bold font-mono text-zinc-100">{performers.worst.symbol}</span>
                </div>
                <p className={`font-bold font-mono text-sm mt-1 ${(performers.worst.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(performers.worst.pnl || 0) >= 0 ? '+' : ''}{fmtUsd(performers.worst.pnl)} ({fmtPct(performers.worst.pnl_pct)})
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Compraste a {fmtUsd(performers.worst.cost_basis)}, ahora vale {fmtUsd(performers.worst.live)}
                </p>
              </>
            ) : (
              <div className="mt-2">
                <span className="text-xs text-emerald-400 font-medium block">Sin pérdidas</span>
                <span className="text-[11px] text-zinc-500 mt-0.5 block">
                  {performers.isSingle ? 'Tu posición está en verde' : 'Todas tus posiciones están en ganancia'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Posiciones activas */}
        <div className="shadcn-card p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <FaClipboardList className="text-blue-400 text-xs" />
            <span className="text-xs font-medium">Posiciones Activas</span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">{rows.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {rows.filter(r => (r.pnl || 0) >= 0).length} en ganancia · {rows.filter(r => (r.pnl || 0) < 0).length} en pérdida
          </p>
        </div>

        {/* Card 4: Targets activos */}
        <div className="shadcn-card p-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <FaCrosshairs className="text-indigo-400 text-xs" />
            <span className="text-xs font-medium">Objetivos Monitoreados</span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            {rows.reduce((sum, r) => sum + (r.targets?.length || 0), 0)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Take-Profit y Stop-Loss monitoreándose 24/7
          </p>
        </div>
      </div>

      {targetSuccess && (
        <div className="p-2.5 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs mb-4 font-mono flex items-center gap-2">
          <FaCircleCheck className="text-emerald-400 shrink-0" />
          <span>{targetSuccess}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Table & Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Holdings Table */}
          <div className="shadcn-panel overflow-hidden">
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-xs uppercase font-mono tracking-wider text-zinc-300">
                  Mis Posiciones ({rows.length})
                </h3>
                <span className="text-xs font-mono text-zinc-500 hidden sm:inline">Precios en tiempo real via CMC</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="shadcn-btn-primary py-1.5 px-3 text-xs font-medium flex items-center gap-1.5"
              >
                <FaPlus className="text-[10px]" />
                <span>Registrar Posición</span>
              </button>
            </div>

            {rows.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-2">
                  <FaChartPie className="text-lg" />
                </div>
                <p className="font-medium text-zinc-300">No tienes posiciones registradas</p>
                <p className="mt-1 text-zinc-400">Registra las criptos que compraste, a qué precio y cuánto para monitorear rendimientos y configurar alertas.</p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-3.5 shadcn-btn-primary py-1.5 px-4 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <FaPlus className="text-[10px]" />
                  <span>Registrar mi primera posición</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/40 text-[11px] font-mono uppercase text-zinc-400">
                    <tr>
                      <th className="py-2.5 px-3.5">Activo</th>
                      <th className="py-2.5 px-3.5 text-right">Cantidad</th>
                      <th className="py-2.5 px-3.5 text-right">Precio Compra</th>
                      <th className="py-2.5 px-3.5 text-right">Precio Actual</th>
                      <th className="py-2.5 px-3.5 text-right">Valor Actual</th>
                      <th className="py-2.5 px-3.5 text-right">Ganancia / Pérdida</th>
                      <th className="py-2.5 px-3.5 text-center">7d</th>
                      <th className="py-2.5 px-3.5 text-center">Objetivos</th>
                      <th className="py-2.5 px-3.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 font-mono">
                    {rows.map(r => {
                      const isGain = (r.pnl || 0) >= 0
                      const hasTargets = r.targets && r.targets.length > 0

                      return (
                        <tr key={r.id} className="hover:bg-zinc-900/40 transition-colors">
                          {/* Logo + Nombre */}
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center gap-2">
                              {r.logo && (
                                <img
                                  src={r.logo}
                                  alt={r.symbol}
                                  className="w-5 h-5 rounded-full bg-zinc-800 shrink-0 object-contain"
                                  onError={e => { e.target.onerror = null; e.target.src = 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' }}
                                />
                              )}
                              <span className="font-bold text-zinc-100">{r.symbol}</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 text-right text-zinc-300">
                            {r.amount?.toLocaleString()}
                          </td>

                          <td className="py-2.5 px-3.5 text-right text-zinc-400">
                            {fmtUsd(r.cost_basis)}
                          </td>

                          <td className="py-2.5 px-3.5 text-right text-zinc-100 font-medium">
                            {fmtUsd(r.live)}
                          </td>

                          <td className="py-2.5 px-3.5 text-right text-zinc-200 font-medium">
                            {fmtUsd(r.current_value)}
                          </td>

                          {/* PnL claro y visible */}
                          <td className="py-2.5 px-3.5 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`font-semibold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isGain ? '+' : ''}{fmtUsd(r.pnl)}
                              </span>
                              <span className={`text-[10px] ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {fmtPct(r.pnl_pct)}
                              </span>
                            </div>
                          </td>

                          {/* Sparkline 7d */}
                          <td className="py-2.5 px-3.5 text-center">
                            {r.cmc_sparkline ? (
                              <img
                                src={r.cmc_sparkline}
                                alt={`${r.symbol} 7d`}
                                className="inline-block h-[20px] w-[60px] object-contain"
                                style={{ filter: (r.change_7d ?? 0) >= 0 ? 'hue-rotate(85deg) saturate(1.8) brightness(1.2)' : 'hue-rotate(330deg) saturate(2) brightness(1.1)' }}
                                onError={e => { e.target.style.display = 'none' }}
                              />
                            ) : (
                              <span className="text-zinc-600 text-[10px]">—</span>
                            )}
                          </td>

                          {/* Targets indicator */}
                          <td className="py-2.5 px-3.5 text-center">
                            <button
                              onClick={() => {
                                setShowTargetForm(showTargetForm === r.id ? null : r.id)
                                setTargetForm({ ...targetForm, holding_id: r.id })
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 mx-auto ${
                                hasTargets
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
                              }`}
                              title="Configurar Take-Profit / Stop-Loss"
                            >
                              <FaCrosshairs className="text-[9px]" />
                              <span>{hasTargets ? `${r.targets.length} Metas` : '+ Meta'}</span>
                            </button>
                          </td>

                          <td className="py-2.5 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedRow(r)}
                                className="text-zinc-500 hover:text-zinc-200 text-xs transition-colors p-1"
                                title="Ver detalles"
                              >
                                <FaClipboardList />
                              </button>
                              <button
                                onClick={() => removeHolding(r.id)}
                                className="text-zinc-600 hover:text-rose-400 transition-colors p-1 text-xs"
                                title="Eliminar posición"
                              >
                                <FaTrashCan />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Target Form (Inline, aparece debajo de la tabla) */}
          {showTargetForm && (
            <div className="shadcn-card p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaBullseye className="text-blue-400 text-xs" />
                  <h4 className="font-medium text-xs text-zinc-200 uppercase font-mono tracking-wider">
                    Configurar Objetivo — {rows.find(r => r.id === showTargetForm)?.symbol || ''}
                  </h4>
                </div>
                <button onClick={() => setShowTargetForm(null)} className="text-zinc-500 hover:text-zinc-200 text-xs p-1">
                  <FaXmark />
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                Cuando el precio o tu ganancia alcance este objetivo, recibirás una <strong className="text-zinc-200">alerta sonora y notificación</strong> para que sepas que es momento de actuar.
              </p>

              {/* Targets existentes */}
              {(() => {
                const holdingTargets = rows.find(r => r.id === showTargetForm)?.targets || []
                if (holdingTargets.length === 0) return null
                return (
                  <div className="mb-3 space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Objetivos activos:</span>
                    {holdingTargets.map(t => (
                      <div key={t.id} className={`flex items-center justify-between p-2 rounded text-xs font-mono ${
                        t.type === 'take_profit' ? 'bg-emerald-950/30 border border-emerald-800/50' : 'bg-rose-950/30 border border-rose-800/50'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {t.type === 'take_profit' ? <FaBullseye className="text-emerald-400" /> : <FaShieldHalved className="text-rose-400" />}
                          <span className={t.type === 'take_profit' ? 'text-emerald-300' : 'text-rose-300'}>
                            {t.type === 'take_profit' ? 'Take-Profit' : 'Stop-Loss'}:
                            {t.mode === 'price' ? ` ${fmtUsd(t.value)}` : ` ${t.value}%`}
                            {t.triggered && <span className="ml-2 text-amber-400">(Disparado)</span>}
                          </span>
                        </div>
                        <button onClick={() => removeTarget(t.id)} className="text-zinc-600 hover:text-rose-400 text-xs p-1">
                          <FaXmark />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })()}

              <form onSubmit={submitTarget} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Tipo</label>
                  <select
                    value={targetForm.type}
                    onChange={e => setTargetForm({ ...targetForm, type: e.target.value })}
                    className="w-full shadcn-input px-2 py-1.5 text-xs text-zinc-100"
                  >
                    <option value="take_profit">Take-Profit (Ganancia)</option>
                    <option value="stop_loss">Stop-Loss (Protección)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Modo</label>
                  <select
                    value={targetForm.mode}
                    onChange={e => setTargetForm({ ...targetForm, mode: e.target.value })}
                    className="w-full shadcn-input px-2 py-1.5 text-xs text-zinc-100"
                  >
                    <option value="price">Por Precio USD</option>
                    <option value="percent">Por % Rendimiento</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    {targetForm.mode === 'price'
                      ? (targetForm.type === 'take_profit' ? 'Vender si el precio sube a:' : 'Avisar si el precio cae a:')
                      : (targetForm.type === 'take_profit' ? 'Avisar si gano este % o más:' : 'Avisar si pierdo este %:')
                    }
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={targetForm.mode === 'price' ? 'Ej: 70000' : 'Ej: 20'}
                    value={targetForm.value}
                    onChange={e => setTargetForm({ ...targetForm, value: e.target.value })}
                    className="w-full shadcn-input px-2 py-1.5 text-xs text-zinc-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!targetForm.value}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md disabled:opacity-50 transition-colors ${
                    targetForm.type === 'take_profit'
                      ? 'bg-emerald-900 text-emerald-100 border border-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-900 text-rose-100 border border-rose-700 hover:bg-rose-800'
                  }`}
                >
                  Guardar Meta
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Risk Diagnosis & Stress Test */}
        <div className="space-y-5">
          {/* Card 1: HHI Risk Concentration Diagnostic */}
          <div className="shadcn-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-xs uppercase font-mono tracking-wider text-zinc-200">
                Diagnóstico de Concentración
              </h4>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 rounded">
                Índice HHI
              </span>
            </div>

            <div className="my-2">
              <D3Gauge
                value={hhiScore}
                min={0}
                max={100}
                size={200}
                strokeWidth={10}
                label={hhiScore < 25 ? 'Bien Diversificado' : hhiScore < 60 ? 'Moderado' : 'Hiperconcentrado'}
                unit="HHI"
                colorScheme="risk"
              />
            </div>

            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs space-y-1.5 mt-3">
              <div className="font-medium flex items-center gap-1.5">
                {hhiScore >= 60 && (
                  <>
                    <FaCircleExclamation className="text-rose-400 shrink-0" />
                    <span className="text-rose-400">Riesgo Alto: Cartera Hiperconcentrada</span>
                  </>
                )}
                {hhiScore >= 25 && hhiScore < 60 && (
                  <>
                    <FaCircleDot className="text-amber-400 shrink-0" />
                    <span className="text-amber-400">Moderado: Podrías diversificar más</span>
                  </>
                )}
                {hhiScore < 25 && (
                  <>
                    <FaCircleCheck className="text-emerald-400 shrink-0" />
                    <span className="text-emerald-400">Excelente: Tu inversión está bien repartida</span>
                  </>
                )}
              </div>

              <p className="text-zinc-400 text-[11px] leading-relaxed">
                {hhiScore >= 60 ? (
                  <>
                    El <strong className="text-zinc-200">{maxConcentration.pct.toFixed(1)}%</strong> de tu capital está colocado únicamente en <strong className="text-zinc-200">{maxConcentration.symbol}</strong>. Si este activo sufre una fuerte corrección, tu cartera no tiene soporte defensivo. Se aconseja distribuir en más activos.
                  </>
                ) : hhiScore >= 25 ? (
                  <>
                    Tu capital está relativamente balanceado. El mayor activo es <strong className="text-zinc-200">{maxConcentration.symbol}</strong> con el {maxConcentration.pct.toFixed(1)}%.
                  </>
                ) : (
                  <>
                    Tu capital está bien distribuido entre {rows.length} activos. Ninguna posición domina tu cartera.
                  </>
                )}
              </p>

              <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex justify-between">
                <span>Mayor: {maxConcentration.symbol} ({maxConcentration.pct.toFixed(1)}%)</span>
                <span>Meta: &lt; 25</span>
              </div>
            </div>
          </div>

          {/* Card 2: Stress Test Crisis Simulator */}
          <div className="shadcn-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-xs uppercase font-mono tracking-wider text-zinc-200">
                Simulador de Crisis
              </h4>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.2 rounded">
                Stress Test
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Mueve el selector para simular: ¿Cuánto perderías si el mercado cae un X%?
            </p>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Caída simulada:</span>
                <span className="text-rose-400 font-bold">-{stressLossPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={stressLossPct}
                onChange={e => setStressLossPct(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-zinc-100"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>-5%</span>
                <span>-30%</span>
                <span>-80%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Pérdida estimada</span>
                <span className="text-sm font-semibold text-rose-400 block mt-0.5">
                  -{fmtUsd(stressLossUSD)}
                </span>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Saldo preservado</span>
                <span className="text-sm font-semibold text-emerald-400 block mt-0.5">
                  {fmtUsd(stressSurvivingValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Pie Chart */}
          {pieData.length > 0 && (
            <div className="shadcn-card p-4">
              <h4 className="font-semibold text-xs uppercase font-mono tracking-wider text-zinc-200 mb-2">
                Distribución de Inversión
              </h4>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={54}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="#0c0c0e" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={v => [fmtUsd(v), 'Valor']}
                      contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-1 justify-center text-[11px] font-mono">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                    <span className="text-zinc-400">{item.name}:</span>
                    <span className="text-zinc-200">{((item.value / (totalValue || 1)) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Holding Modal — Shadcn UI Dark Matte */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75"
            onClick={() => setShowAddModal(false)}
          />

          <div className="relative bg-[#0c0c0e] border border-zinc-800 rounded-lg shadow-xl w-full max-w-md z-10 text-xs font-sans overflow-hidden">
            {/* Shadcn Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <FaShieldHalved className="text-xs" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {isAuthenticated ? 'Registrar Nueva Posición' : 'Portafolio Privado'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {isAuthenticated ? 'Añadir activo a seguimiento en vivo' : 'Seguridad y privacidad con UUID'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-zinc-200 text-sm p-1 transition-colors"
                title="Cerrar"
              >
                <FaXmark />
              </button>
            </div>

            {/* Shadcn Dialog Body */}
            <div className="p-5">
              {isAuthenticated ? (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                      Símbolo del Activo
                    </label>
                    <input
                      type="text"
                      placeholder="BTC, ETH, SOL..."
                      value={form.symbol}
                      onChange={e => setForm({ ...form, symbol: e.target.value })}
                      className="w-full shadcn-input px-3 py-2 text-xs uppercase font-mono"
                      autoFocus
                      required
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">Ticker oficial registrado en CoinMarketCap</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.5"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        className="w-full shadcn-input px-3 py-2 text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                        Precio Compra (USD)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="65000"
                        value={form.cost_basis}
                        onChange={e => setForm({ ...form, cost_basis: e.target.value })}
                        className="w-full shadcn-input px-3 py-2 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="shadcn-btn-outline px-3 py-1.5 text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !form.symbol || !form.amount || !form.cost_basis}
                      className="shadcn-btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FaPlus className="text-[10px]" />
                      <span>{submitting ? 'Guardando…' : 'Guardar Posición'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="shadcn-card p-3.5 border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                        <FaLock className="text-xs" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-zinc-200 text-xs">
                          Inicia sesión para registrar posiciones
                        </p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Para proteger tus datos y garantizar que nadie más vea tus inversiones, cada registro se cifra y vincula exclusivamente a tu cuenta con identificadores UUID.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-b border-zinc-800 py-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <FaCircleCheck className="text-zinc-500 text-xs shrink-0" />
                      <span>Aislamiento 100% privado con UUID por usuario</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <FaCircleCheck className="text-zinc-500 text-xs shrink-0" />
                      <span>Cotizaciones en tiempo real via CoinMarketCap Pro API</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <FaCircleCheck className="text-zinc-500 text-xs shrink-0" />
                      <span>Alertas sonoras autónomas de Take-Profit y Stop-Loss</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="shadcn-btn-outline px-3 py-1.5 text-xs"
                    >
                      Cancelar
                    </button>
                    <a
                      href="/register"
                      className="shadcn-btn-secondary px-3 py-1.5 text-xs"
                    >
                      Crear Cuenta
                    </a>
                    <a
                      href="/login"
                      className="shadcn-btn-primary px-3.5 py-1.5 text-xs font-medium"
                    >
                      Iniciar Sesión
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedRow(null)} />
          <div className="relative bg-[#0c0c0e] border border-zinc-800 rounded-lg p-6 max-w-md w-full z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-3">
                {selectedRow.logo && (
                  <img src={selectedRow.logo} alt={selectedRow.symbol} className="w-8 h-8 rounded-full bg-zinc-800 object-contain" />
                )}
                <div>
                  <h3 className="text-base font-bold text-zinc-100">{selectedRow.symbol}</h3>
                  <span className="text-[11px] text-zinc-500 font-mono">Detalle de posición</span>
                </div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-zinc-400 hover:text-zinc-100 text-sm p-1">
                <FaXmark />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Precio de Compra</span>
                  <span className="text-zinc-100 font-semibold">{fmtUsd(selectedRow.cost_basis)}</span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Precio Actual</span>
                  <span className="text-zinc-100 font-semibold">{fmtUsd(selectedRow.live)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Invertiste</span>
                  <span className="text-zinc-100 font-semibold">{fmtUsd(selectedRow.cost_value)}</span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Vale Ahora</span>
                  <span className="text-zinc-100 font-semibold">{fmtUsd(selectedRow.current_value)}</span>
                </div>
              </div>

              <div className={`p-3 rounded border ${(selectedRow.pnl || 0) >= 0 ? 'bg-emerald-950/30 border-emerald-800/60' : 'bg-rose-950/30 border-rose-800/60'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                    {(selectedRow.pnl || 0) >= 0 ? (
                      <>
                        <FaArrowTrendUp className="text-emerald-400" />
                        <span>Rendimiento positivo</span>
                      </>
                    ) : (
                      <>
                        <FaArrowTrendDown className="text-rose-400" />
                        <span>Rendimiento negativo</span>
                      </>
                    )}
                  </span>
                  <span className={`text-lg font-bold ${(selectedRow.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(selectedRow.pnl || 0) >= 0 ? '+' : ''}{fmtUsd(selectedRow.pnl)}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] mt-1">
                  Retorno: <strong className={(selectedRow.pnl_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmtPct(selectedRow.pnl_pct)}</strong>
                  {selectedRow.change_24h != null && (
                    <> · 24h: <strong className={(selectedRow.change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmtPct(selectedRow.change_24h)}</strong></>
                  )}
                  {selectedRow.change_7d != null && (
                    <> · 7d: <strong className={(selectedRow.change_7d || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmtPct(selectedRow.change_7d)}</strong></>
                  )}
                </p>
              </div>

              {/* Sparkline */}
              {selectedRow.cmc_sparkline && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-zinc-500 mb-1">Curva 7d</span>
                  <img
                    src={selectedRow.cmc_sparkline}
                    alt={`${selectedRow.symbol} 7d`}
                    className="h-[35px] w-[140px] object-contain"
                    style={{ filter: (selectedRow.change_7d ?? 0) >= 0 ? 'hue-rotate(85deg) saturate(1.8) brightness(1.2)' : 'hue-rotate(330deg) saturate(2) brightness(1.1)' }}
                  />
                </div>
              )}

              {/* Targets in modal */}
              {selectedRow.targets && selectedRow.targets.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Objetivos configurados</span>
                  {selectedRow.targets.map(t => (
                    <div key={t.id} className={`flex items-center justify-between p-2 rounded mb-1 text-[11px] ${
                      t.type === 'take_profit' ? 'bg-emerald-950/30 border border-emerald-800/50' : 'bg-rose-950/30 border border-rose-800/50'
                    }`}>
                      <span className={`flex items-center gap-1.5 ${t.type === 'take_profit' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {t.type === 'take_profit' ? <FaBullseye className="text-emerald-400" /> : <FaShieldHalved className="text-rose-400" />}
                        {t.mode === 'price' ? fmtUsd(t.value) : `${t.value}%`}
                        {t.triggered && ' (Alcanzado)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
