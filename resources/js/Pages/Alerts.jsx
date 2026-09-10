import { useState, useEffect } from 'react'
import { router, usePage, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { playAlertChime, requestNotificationPermission, sendDesktopNotification } from '@/lib/sound'
import {
  FaBell,
  FaPlus,
  FaXmark,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaClock,
  FaCircleCheck,
  FaTrashCan,
  FaLock
} from 'react-icons/fa6'

function fmtUsd(n) {
  if (n == null) return '—'
  if (n >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${n.toFixed(6)}`
}

export default function Alerts({ alerts = [], isAuthenticated = false, callLog = [] }) {
  const { flash } = usePage().props
  const [form, setForm] = useState({ symbol: '', direction: 'above', target: '' })
  const [submitting, setSubmitting] = useState(false)
  const [notifPermission, setNotifPermission] = useState('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  async function handleEnableNotifications() {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      sendDesktopNotification('Notificaciones Activadas', {
        body: 'CryptoScope te avisará en tu pantalla cuando una alerta se cumpla.',
      })
      playAlertChime()
    }
  }

  function submit(e) {
    e.preventDefault()
    if (!form.symbol || !form.target) return
    setSubmitting(true)
    router.post('/alerts', {
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      target: parseFloat(form.target),
    }, {
      onFinish: () => {
        setSubmitting(false)
        setForm({ symbol: '', direction: 'above', target: '' })
      }
    })
  }

  function remove(id) {
    try {
      const raw = localStorage.getItem('cs_dismissed_alerts')
      if (raw) {
        const list = JSON.parse(raw).filter(item => item !== id)
        localStorage.setItem('cs_dismissed_alerts', JSON.stringify(list))
      }
    } catch (e) {}
    router.delete(`/alerts/${id}`)
  }

  const triggered = alerts.filter(a => a.triggered)
  const pending = alerts.filter(a => !a.triggered)

  return (
    <AppLayout callLog={callLog}>
      <Head title="Alertas de Precio Autónomas" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Alertas de Precio Autónomas
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitoreo en tiempo real de niveles críticos con sonido y notificaciones push.
          </p>
        </div>
      </div>

      {/* Flash Messages */}
      {flash?.error && (
        <div className="shadcn-card p-3.5 mb-5 border-l-4 border-l-rose-500 bg-rose-950/20 text-rose-200 text-xs">
          {flash.error}
        </div>
      )}
      {flash?.success && (
        <div className="shadcn-card p-3.5 mb-5 border-l-4 border-l-emerald-500 bg-emerald-950/20 text-emerald-200 text-xs">
          {flash.success}
        </div>
      )}

      {/* Banner de permiso si aún no concedido */}
      {notifPermission !== 'granted' && (
        <div className="shadcn-card p-4 mb-6 border-l-4 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 shrink-0">
              <FaBell className="text-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Activa Notificaciones Push</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Permite que CryptoScope te notifique al instante incluso si tienes la pestaña en segundo plano.
              </p>
            </div>
          </div>

          <button
            onClick={handleEnableNotifications}
            className="shadcn-btn-primary px-3 py-1.5 text-xs whitespace-nowrap"
          >
            Permitir Notificaciones
          </button>
        </div>
      )}

      {/* Form (Authenticated) or Auth Notice (Guest) */}
      {isAuthenticated ? (
        <form onSubmit={submit} className="shadcn-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaPlus className="text-zinc-400 text-xs" />
            <h4 className="font-medium text-xs text-zinc-200 uppercase font-mono tracking-wider">
              Crear Alerta de Precio
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Moneda (ej. BTC)</label>
              <input
                type="text"
                placeholder="BTC"
                value={form.symbol}
                onChange={e => setForm({ ...form, symbol: e.target.value })}
                className="w-full shadcn-input px-3 py-1.5 text-xs uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Condición</label>
              <select
                value={form.direction}
                onChange={e => setForm({ ...form, direction: e.target.value })}
                className="w-full shadcn-input px-3 py-1.5 text-xs text-zinc-200"
              >
                <option value="above">Alza: Sube por encima de</option>
                <option value="below">Baja: Cae por debajo de</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Precio Objetivo (USD)</label>
              <input
                type="number"
                step="any"
                placeholder="65000"
                value={form.target}
                onChange={e => setForm({ ...form, target: e.target.value })}
                className="w-full shadcn-input px-3 py-1.5 text-xs font-mono"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting || !form.symbol || !form.target}
                className="w-full shadcn-btn-primary py-1.5 px-3 text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <FaPlus className="text-[10px]" />
                <span>{submitting ? 'Guardando…' : 'Crear Alerta'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="shadcn-card p-4 mb-6 border-zinc-800 bg-zinc-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                <FaLock className="text-xs" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-zinc-200 uppercase font-mono tracking-wider">
                  Inicia sesión para crear alertas
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Para registrar alertas de precio privadas, asociarlas a tu cuenta con identificadores UUID y recibir avisos sonoros en segundo plano, debes iniciar sesión.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/register"
                className="shadcn-btn-secondary px-3 py-1.5 text-xs whitespace-nowrap"
              >
                Crear Cuenta
              </a>
              <a
                href="/login"
                className="shadcn-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap"
              >
                Iniciar Sesión
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="space-y-5">
        {/* Triggered */}
        {triggered.length > 0 && (
          <div className="shadcn-panel p-4 border-rose-800/80 bg-rose-950/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaCircleCheck className="text-rose-400 text-xs" />
                <h3 className="font-semibold text-xs uppercase font-mono tracking-wider text-rose-400">
                  Alertas Disparadas ({triggered.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-rose-500">Objetivo alcanzado</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {triggered.map(a => (
                <div
                  key={a.id}
                  className="bg-zinc-950 border border-zinc-800 rounded p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-zinc-100 text-sm">{a.symbol}</span>
                      <span className="text-[10px] font-mono uppercase bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded flex items-center gap-1">
                        {a.direction === 'above' ? <FaArrowTrendUp className="text-[9px]" /> : <FaArrowTrendDown className="text-[9px]" />}
                        <span>{a.direction === 'above' ? 'Alza' : 'Baja'}</span>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-1">
                      Meta: {fmtUsd(a.target)} · <span className="text-rose-400 font-semibold">Actual: {fmtUsd(a.current_price)}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => remove(a.id)}
                    className="text-zinc-600 hover:text-rose-400 p-1 text-xs transition-colors"
                    title="Eliminar alerta"
                  >
                    <FaTrashCan />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending */}
        <div className="shadcn-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaClock className="text-zinc-400 text-xs" />
              <h3 className="font-semibold text-xs uppercase font-mono tracking-wider text-zinc-300">
                Monitoreo Activo ({pending.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              El motor global las revisa en segundo plano
            </span>
          </div>

          {pending.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-xs">
              {isAuthenticated
                ? 'No tienes alertas pendientes de activación. Crea una en el formulario superior.'
                : 'Inicia sesión para ver y gestionar tus alertas de precio personales.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {pending.map(a => {
                const distancePct = a.current_price && a.target
                  ? Math.abs(((a.current_price - a.target) / a.target) * 100).toFixed(1)
                  : null

                return (
                  <div
                    key={a.id}
                    className="bg-zinc-900 border border-zinc-800 rounded p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-zinc-100 text-sm">{a.symbol}</span>
                        <span className="text-[11px] text-zinc-500">
                          {a.direction === 'above' ? 'si sube a' : 'si cae a'}
                        </span>
                        <span className="font-mono font-medium text-zinc-200 text-xs">{fmtUsd(a.target)}</span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Actual: {fmtUsd(a.current_price)}
                        {distancePct && (
                          <span className="text-zinc-500 ml-1.5">(A {distancePct}% de la meta)</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => remove(a.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1 text-xs transition-colors"
                      title="Eliminar alerta"
                    >
                      <FaTrashCan />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
