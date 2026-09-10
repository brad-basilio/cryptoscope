import AppLayout from '@/Layouts/AppLayout'
import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import {
  FaShieldHalved,
  FaServer,
  FaDatabase,
  FaUsers,
  FaBell,
  FaBriefcase,
  FaRotate,
  FaCheck,
  FaTriangleExclamation,
  FaChartLine,
  FaClock,
  FaTrashCan,
  FaKey,
} from 'react-icons/fa6'

export default function Dashboard({ keyInfo = {}, callLog = [], stats = {}, users = [] }) {
  const [purging, setPurging] = useState(false)
  const [activeTab, setActiveTab] = useState('telemetry') // 'telemetry' | 'calls' | 'users'

  const handlePurgeCache = () => {
    if (confirm('¿Deseas vaciar la memoria caché de CoinMarketCap Pro? Las siguientes consultas consumirán créditos en tiempo real.')) {
      setPurging(true)
      router.post(route('admin.purge-cache'), {}, {
        onFinish: () => setPurging(false),
      })
    }
  }

  const handleToggleRole = (userId, currentRole, userName) => {
    const nextRole = currentRole === 'super_admin' ? 'Usuario Estándar' : 'Super Administrador'
    if (confirm(`¿Cambiar el rol de "${userName}" a ${nextRole}?`)) {
      router.post(route('admin.users.toggle-role', userId))
    }
  }

  // Cálculos de consumo de créditos
  const creditLimit = keyInfo.credit_limit_month || 333333
  const creditsUsed = keyInfo.current_month || 0
  const creditsPct = Math.min(100, Math.round((creditsUsed / creditLimit) * 100))

  return (
    <AppLayout callLog={callLog}>
      <Head title="Super Admin — Consola de Telemetría CMC" />

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Banner Superior de Consola */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-800/80 flex items-center justify-center text-amber-400 text-lg shadow-inner">
              <FaShieldHalved />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
                  Consola de Telemetría &amp; Super Admin
                </h1>
                <span className="text-[10px] font-mono font-semibold bg-amber-950/70 border border-amber-800/90 text-amber-300 px-2 py-0.5 rounded-full">
                  NIVEL ROOT
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Auditoría en tiempo real de endpoints de CoinMarketCap Pro API, consumo de cuota, latencias y control de usuarios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePurgeCache}
              disabled={purging}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 transition-colors font-mono disabled:opacity-50"
              title="Forzar actualización fresca de todos los endpoints de CMC"
            >
              <FaRotate className={purging ? 'animate-spin' : ''} />
              <span>{purging ? 'Purgando Caché...' : 'Purgar Caché CMC'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas KPI de Alto Impacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plan & Créditos */}
          <div className="shadcn-card p-4 bg-[#0c0c0e] border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-mono flex items-center gap-1.5">
                  <FaKey className="text-amber-400" /> Plan CMC Pro
                </span>
                <span className="font-mono text-emerald-400 text-[11px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900">
                  Activo
                </span>
              </div>
              <div className="text-lg font-bold text-zinc-100 font-mono tracking-tight">
                {keyInfo.plan_name || 'Startup Hackathon'}
              </div>
              <div className="text-xs text-zinc-400 mt-1 font-mono">
                {creditsUsed.toLocaleString()} / {creditLimit.toLocaleString()} créditos usados
              </div>
              {keyInfo.reset_time && (
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Reinicio mensual: {keyInfo.reset_time}
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    creditsPct > 80 ? 'bg-rose-500' : creditsPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(2, creditsPct)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-1.5">
                <span>{creditsPct}% del cupo mensual</span>
                <span>Límite: {keyInfo.rate_limit_minute || 30} req/min</span>
              </div>
            </div>
          </div>

          {/* Latencia Media API */}
          <div className="shadcn-card p-4 bg-[#0c0c0e] border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-mono flex items-center gap-1.5">
                  <FaClock className="text-blue-400" /> Latencia Promedio
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Últimas llamadas</span>
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {stats.avg_latency_ms || 0} <span className="text-xs font-normal text-zinc-500">ms</span>
              </div>
            </div>
            <div className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/80 font-mono flex items-center justify-between">
              <span>Tiempo de respuesta:</span>
              <span className={stats.avg_latency_ms < 500 ? 'text-emerald-400' : 'text-amber-400'}>
                {stats.avg_latency_ms < 500 ? '⚡ Óptimo' : '⚠ Normal'}
              </span>
            </div>
          </div>

          {/* Alertas & Targets Auditados */}
          <div className="shadcn-card p-4 bg-[#0c0c0e] border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-mono flex items-center gap-1.5">
                  <FaBell className="text-rose-400" /> Motor de Alertas
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900">
                  {stats.active_alerts} Activas
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {stats.total_alerts}{' '}
                <span className="text-xs font-normal text-zinc-500">alertas de precio</span>
              </div>
            </div>
            <div className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/80 font-mono flex items-center justify-between">
              <span>Targets TP/SL:</span>
              <span className="text-zinc-200 font-semibold">{stats.total_targets} configurados</span>
            </div>
          </div>

          {/* Usuarios & Portafolios */}
          <div className="shadcn-card p-4 bg-[#0c0c0e] border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-mono flex items-center gap-1.5">
                  <FaUsers className="text-purple-400" /> Usuarios &amp; Activos
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Total en BD</span>
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {stats.total_users}{' '}
                <span className="text-xs font-normal text-zinc-500">cuentas</span>
              </div>
            </div>
            <div className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/80 font-mono flex items-center justify-between">
              <span>Posiciones Portafolio:</span>
              <span className="text-zinc-200 font-semibold">{stats.total_holdings} auditadas</span>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación Interna del Dashboard */}
        <div className="flex items-center gap-2 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'border-zinc-100 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FaServer className="text-[11px]" />
            <span>Telemetría de Endpoints CMC</span>
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'calls'
                ? 'border-zinc-100 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FaChartLine className="text-[11px]" />
            <span>Historial de Llamadas ({callLog.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-zinc-100 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FaUsers className="text-[11px]" />
            <span>Gestión de Roles ({users.length})</span>
          </button>
        </div>

        {/* TAB 1: TELEMETRÍA DE ENDPOINTS INTEGRADOS */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="shadcn-card bg-[#0c0c0e] border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Endpoints Oficiales CoinMarketCap Pro Integrados en CryptoScope
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Cada uno de estos 6 endpoints fue integrado cumpliendo con los estándares del Build with CMC Hackathon.
                  </p>
                </div>
                <span className="text-xs font-mono bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded text-zinc-300">
                  6 Endpoints Activos
                </span>
              </div>

              <div className="divide-y divide-zinc-800/80 font-mono text-xs">
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-900/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800 text-[10px] font-bold">
                        GET
                      </span>
                      <span className="font-semibold text-zinc-200">/v1/cryptocurrency/listings/latest</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Alimenta el <strong>Screener</strong> principal con ordenamiento por capitalización, volumen 24h, cambios 1h/24h/7d y cálculo de suministro circulante.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Caché TTL</span>
                      <span className="text-zinc-300">60 segundos</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Créditos/Req</span>
                      <span className="text-amber-400">1 crédito</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                      OK 200
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-900/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800 text-[10px] font-bold">
                        GET
                      </span>
                      <span className="font-semibold text-zinc-200">/v1/cryptocurrency/quotes/latest</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Alimenta el <strong>Portfolio Tracker</strong> y el <strong>Motor de Alertas Autónomo</strong>. Evalúa Take-Profit / Stop-Loss con latencia ultra-baja.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Caché TTL</span>
                      <span className="text-zinc-300">30 segundos</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Créditos/Req</span>
                      <span className="text-amber-400">1 crédito</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                      OK 200
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-900/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800 text-[10px] font-bold">
                        DEX
                      </span>
                      <span className="font-semibold text-zinc-200">/v1/dex/tokens/transactions</span>
                      <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 rounded">
                        Diferenciador Clave
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Alimenta el <strong>Whale Detector</strong> analizando transacciones on-chain en Ethereum de pares DEX (Uniswap/SushiSwap), calculando la relación Buy/Sell volume.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Caché TTL</span>
                      <span className="text-zinc-300">Sin caché (0s)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Paginación</span>
                      <span className="text-zinc-300">8 páginas depth</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                      OK 200
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-900/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800 text-[10px] font-bold">
                        GET
                      </span>
                      <span className="font-semibold text-zinc-200">/v1/global-metrics/quotes/latest</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Alimenta el <strong>Market Pulse</strong> con dominancia de BTC/ETH, Market Cap global y volumen agregado de las últimas 24 horas.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Caché TTL</span>
                      <span className="text-zinc-300">120 segundos</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Créditos/Req</span>
                      <span className="text-amber-400">1 crédito</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                      OK 200
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-900/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800 text-[10px] font-bold">
                        GET
                      </span>
                      <span className="font-semibold text-zinc-200">/v3/fear-and-greed/latest</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Índice de Miedo y Codicia del mercado cripto directo desde los servidores de CoinMarketCap.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Caché TTL</span>
                      <span className="text-zinc-300">180 segundos</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Créditos/Req</span>
                      <span className="text-amber-400">1 crédito</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                      OK 200
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-900/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800 text-[10px] font-bold">
                        GET
                      </span>
                      <span className="font-semibold text-zinc-200">/v1/altcoin-season-index/latest</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Métrica de temporada de altcoins para comparar el desempeño de las 50 principales criptomonedas vs Bitcoin.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Caché TTL</span>
                      <span className="text-zinc-300">300 segundos</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Créditos/Req</span>
                      <span className="text-amber-400">1 crédito</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                      OK 200
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORIAL DE LLAMADAS */}
        {activeTab === 'calls' && (
          <div className="shadcn-card bg-[#0c0c0e] border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100">
                Llamadas Recientes a la API de CoinMarketCap Pro
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Auditoría en memoria de las últimas peticiones salientes con código de respuesta HTTP y latencia en milisegundos.
              </p>
            </div>

            {callLog.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono">
                No hay registros de llamadas recientes en caché. Navega por el Screener o Portfolio para generar tráfico.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                      <th className="p-3">Hora</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">Parámetros</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Latencia</th>
                      <th className="p-3">Créditos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {callLog.map((call, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30">
                        <td className="p-3 text-zinc-500 text-[11px]">
                          {call.timestamp ? new Date(call.timestamp).toLocaleTimeString() : 'Reciente'}
                        </td>
                        <td className="p-3 font-semibold text-zinc-200">
                          {call.endpoint}
                        </td>
                        <td className="p-3 text-zinc-400 max-w-xs truncate text-[11px]">
                          {JSON.stringify(call.params || {})}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              call.status >= 200 && call.status < 300
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {call.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">
                          {call.elapsed_ms} ms
                        </td>
                        <td className="p-3 text-amber-400">
                          {call.credits != null ? `${call.credits} cred` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GESTIÓN DE USUARIOS Y ROLES */}
        {activeTab === 'users' && (
          <div className="shadcn-card bg-[#0c0c0e] border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100">
                Usuarios Registrados en CryptoScope
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Listado de usuarios registrados en el sistema, recuento de portafolios y control de elevación a Super Admin.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                    <th className="p-3">ID</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Correo Electrónico</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Holdings</th>
                    <th className="p-3">Alertas</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-900/30">
                      <td className="p-3 text-zinc-500">#{u.id}</td>
                      <td className="p-3 font-semibold text-zinc-200">{u.name}</td>
                      <td className="p-3 text-zinc-400">{u.email}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            u.role === 'super_admin'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">{u.holdings_count || 0}</td>
                      <td className="p-3 text-zinc-400">{u.alerts_count || 0}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleRole(u.id, u.role, u.name)}
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] transition-colors"
                        >
                          {u.role === 'super_admin' ? 'Degradar a User' : 'Elevar a Super Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

