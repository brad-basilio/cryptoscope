import { Link, usePage } from '@inertiajs/react'
import { useState, useEffect, useRef } from 'react'
import ApiInspector from '@/Components/ApiInspector'
import CryptoScopeLogo from '@/Components/CryptoScopeLogo'
import { playAlertChime, sendDesktopNotification } from '@/lib/sound'
import { FaXmark, FaCircleExclamation, FaUser, FaRightFromBracket, FaShieldHalved } from 'react-icons/fa6'

const NAV = [
  { href: '/screener',       label: 'Screener' },
  { href: '/portfolio',      label: 'Portfolio' },
  { href: '/alerts',         label: 'Alertas' },
  { href: '/whale-detector', label: 'Whale Detector' },
  { href: '/market-pulse',   label: 'Market Pulse' },
]

function fmtUsd(n) {
  if (n == null) return '—'
  if (n >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${n.toFixed(5)}`
}

function getDismissedAlerts() {
  try {
    const raw = localStorage.getItem('cs_dismissed_alerts')
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function addDismissedAlert(id) {
  try {
    const current = getDismissedAlerts()
    if (!current.includes(id)) {
      localStorage.setItem('cs_dismissed_alerts', JSON.stringify([...current, id]))
    }
  } catch (e) {}
}

export default function AppLayout({ children, callLog = [] }) {
  const { url, props } = usePage()
  const user = props?.auth?.user
  const [showInspector, setShowInspector] = useState(false)
  const [globalToasts, setGlobalToasts] = useState([])
  const [triggeredCount, setTriggeredCount] = useState(0)

  const notifiedSetRef = useRef(new Set(getDismissedAlerts()))

  // Motor Global de Alertas en Background con memoria persistente
  useEffect(() => {
    let isMounted = true

    async function checkGlobalAlerts() {
      try {
        // Verificar alertas de precio
        const res = await fetch('/api/alerts/check')
        if (!res.ok) return
        const data = await res.json()

        if (!isMounted) return

        const triggered = data.triggered || []
        const dismissed = getDismissedAlerts()

        // Filtrar las alertas que el usuario ya cerró o descartó previamente
        const unacknowledged = triggered.filter(a => !dismissed.includes(a.id))
        setTriggeredCount(unacknowledged.length)

        const newlyTriggered = []
        unacknowledged.forEach(a => {
          if (!notifiedSetRef.current.has(a.id)) {
            newlyTriggered.push(a)
            notifiedSetRef.current.add(a.id)
          }
        })

        if (newlyTriggered.length > 0) {
          // Sonido de alerta global (solo para eventos nuevos no descartados)
          playAlertChime()

          // Notificación de escritorio global
          newlyTriggered.forEach(a => {
            const dir = a.direction === 'above' ? 'superó' : 'cayó por debajo de'
            const msg = `${a.symbol} ${dir} ${fmtUsd(a.target)}. Precio actual: ${fmtUsd(a.current_price)}`
            sendDesktopNotification(`Alerta Disparada: ${a.symbol}`, { body: msg })

            setGlobalToasts(prev => [
              ...prev,
              {
                id: a.id,
                symbol: a.symbol,
                msg,
                time: new Date().toLocaleTimeString(),
              }
            ])
          })
        }

        // También verificar targets de portfolio (Take-Profit / Stop-Loss)
        try {
          const ptRes = await fetch('/api/portfolio/check-targets')
          if (ptRes.ok) {
            const ptData = await ptRes.json()
            const ptTriggered = ptData.triggered || []
            if (ptTriggered.length > 0 && isMounted) {
              ptTriggered.forEach(t => {
                const ptKey = `pt_${t.id}`
                if (!notifiedSetRef.current.has(ptKey)) {
                  notifiedSetRef.current.add(ptKey)
                  const isTP = t.type === 'take_profit'
                  const label = isTP ? 'Take-Profit Alcanzado' : 'Stop-Loss Disparado'
                  const body = `${t.symbol}: ${isTP ? 'Ganancia' : 'Pérdida'} ${t.pnl_pct >= 0 ? '+' : ''}${t.pnl_pct}%. Precio: ${fmtUsd(t.current_price)}`
                  sendDesktopNotification(label, { body })
                  playAlertChime()
                }
              })
            }
          }
        } catch {}
      } catch (err) {
        // Silencio en caso de corte temporal de red
      }
    }

    checkGlobalAlerts()
    const interval = setInterval(checkGlobalAlerts, 25000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  function dismissToast(id) {
    addDismissedAlert(id)
    notifiedSetRef.current.add(id)
    setGlobalToasts(prev => prev.filter(t => t.id !== id))
    setTriggeredCount(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased relative">
      {/* Global Toasts Container (Aparece en cualquier página del sistema) */}
      <div className="fixed top-16 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {globalToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#0c0c0e] border border-rose-800 rounded-md p-3.5 shadow-2xl flex items-start gap-3 transition-all"
          >
            <div className="w-6 h-6 rounded bg-rose-950/80 border border-rose-800 flex items-center justify-center text-xs font-bold text-rose-400 shrink-0 mt-0.5">
              <FaCircleExclamation />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-xs text-zinc-100">{toast.symbol} Cruzó su Meta</p>
                <span className="text-[10px] font-mono text-zinc-500">{toast.time}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{toast.msg}</p>
              <div className="flex items-center gap-3 mt-2">
                <Link
                  href="/alerts"
                  onClick={() => dismissToast(toast.id)}
                  className="text-[11px] font-mono font-medium text-rose-400 hover:text-rose-300 underline"
                >
                  Ver en Alertas →
                </Link>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-200 text-xs p-1"
            >
              <FaXmark />
            </button>
          </div>
        ))}
      </div>

      {/* Shadcn Clean Solid Header */}
      <header className="border-b border-zinc-800 bg-[#09090b] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Brand / Logo */}
            <Link href="/screener" className="flex items-center gap-2.5 group">
              <CryptoScopeLogo className="w-8 h-8 group-hover:border-zinc-500 transition-colors" />
              <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                CryptoScope
              </span>
            </Link>

            {/* Navigation Tabs (Shadcn TabsList Style) */}
            <nav className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
              {NAV.map((item) => {
                const active = url.startsWith(item.href)
                const isAlertsTab = item.href === '/alerts'

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      active
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isAlertsTab && triggeredCount > 0 && (
                      <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                        {triggeredCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Status & Inspector Button */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>CMC En Vivo</span>
              </div>

              <button
                onClick={() => setShowInspector(true)}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 px-3 py-1 rounded-md transition-colors"
                title="Auditoría de llamadas a la API de CoinMarketCap"
              >
                <span className="font-mono text-[11px]">Inspector API</span>
                {callLog.length > 0 && (
                  <span className="bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded">
                    {callLog.length}
                  </span>
                )}
              </button>

              {/* User Account / Login & Register */}
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                {user ? (
                  <div className="flex items-center gap-2">
                    {user.role === 'super_admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-md transition-colors font-mono"
                        title="Consola de Telemetría & Super Admin"
                      >
                        <FaShieldHalved className="text-[10px] text-amber-400" />
                        <span className="font-semibold tracking-wider text-[11px] uppercase">Super Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-md transition-colors font-mono"
                      title="Mi Perfil"
                    >
                      <FaUser className="text-[10px] text-zinc-400" />
                      <span className="max-w-[100px] truncate">{user.name}</span>
                    </Link>
                    <Link
                      href="/logout"
                      method="post"
                      as="button"
                      className="text-zinc-500 hover:text-rose-400 p-1 text-xs transition-colors"
                      title="Cerrar Sesión"
                    >
                      <FaRightFromBracket />
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/login"
                      className="text-xs text-zinc-300 hover:text-zinc-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/register"
                      className="shadcn-btn-primary text-xs px-2.5 py-1"
                    >
                      Crear Cuenta
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer Minimalista & Distintivo con Principios de frontend-design */}
      <footer className="border-t border-zinc-800/80 bg-[#09090b] mt-24 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-zinc-800/60">
            {/* Identidad de Marca */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CryptoScopeLogo className="w-7 h-7 rounded-md border-zinc-800" />
                <span className="font-semibold text-sm tracking-tight text-white">
                  CryptoScope
                </span>
                <span className="text-zinc-600">/</span>
                <span className="text-xs text-zinc-400">
                  Build with CMC Hackathon 2026
                </span>
              </div>
              <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                Plataforma web impulsada por la API oficial de CoinMarketCap para el análisis de mercado, detección de liquidez en DEX y gestión de riesgo.
              </p>
            </div>

            {/* Accesos Rápidos y Acciones */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowInspector(true)}
                className="shadcn-btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-2 font-mono hover:border-zinc-700"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Inspector API</span>
                <span className="text-[10px] text-zinc-500">[{callLog.length}]</span>
              </button>

              <a
                href="https://coinmarketcap.com/api/resources/api-hackathon/"
                target="_blank"
                rel="noopener noreferrer"
                className="shadcn-btn-primary text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5"
              >
                <span>Evento Oficial CMC</span>
                <span className="text-[10px] opacity-70">↗</span>
              </a>
            </div>
          </div>

          {/* Navegación y Referencias */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8 text-xs">
            <div className="space-y-2.5">
              <p className="text-[11px] font-mono uppercase text-zinc-300 font-semibold tracking-wider">
                Explorar
              </p>
              <ul className="space-y-1.5 text-zinc-400">
                <li><Link href="/screener" className="hover:text-white transition-colors">Screener</Link></li>
                <li><Link href="/whale-detector" className="hover:text-white transition-colors">Whale Detector</Link></li>
                <li><Link href="/market-pulse" className="hover:text-white transition-colors">Market Pulse</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] font-mono uppercase text-zinc-300 font-semibold tracking-wider">
                Herramientas
              </p>
              <ul className="space-y-1.5 text-zinc-400">
                <li><Link href="/portfolio" className="hover:text-white transition-colors">Portafolio &amp; HHI</Link></li>
                <li><Link href="/alerts" className="hover:text-white transition-colors">Alertas Autónomas</Link></li>
                <li>
                  <button onClick={() => setShowInspector(true)} className="hover:text-white transition-colors text-left">
                    Telemetría de API
                  </button>
                </li>
                {user?.role === 'super_admin' && (
                  <li>
                    <Link href="/admin" className="text-amber-400/90 hover:text-amber-300 transition-colors font-mono">
                      Consola Super Admin ↗
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] font-mono uppercase text-zinc-300 font-semibold tracking-wider">
                Endpoints CMC
              </p>
              <ul className="space-y-1.5 font-mono text-[11px] text-zinc-500">
                <li>/cryptocurrency/listings</li>
                <li>/cryptocurrency/quotes</li>
                <li>/dex/tokens/transactions</li>
                <li>/global-metrics/quotes</li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] font-mono uppercase text-zinc-300 font-semibold tracking-wider">
                Tecnología
              </p>
              <ul className="space-y-1.5 text-zinc-500">
                <li>Laravel 12</li>
                <li>Inertia.js + React 18</li>
                <li>Tailwind CSS + Shadcn UI</li>
                <li>Licencia MIT</li>
              </ul>
            </div>
          </div>

          {/* Sub-barra inferior */}
          <div className="pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Conexión activa con CoinMarketCap API</span>
            </div>
            <div>
              <span>© 2026 CryptoScope. Todos los derechos reservados.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* API Inspector Modal */}
      {showInspector && (
        <ApiInspector
          callLog={callLog}
          onClose={() => setShowInspector(false)}
        />
      )}
    </div>
  )
}
