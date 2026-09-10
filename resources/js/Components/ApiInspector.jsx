/**
 * ApiInspector — Modal de auditoría técnica (Estilo shadcn/ui)
 * Muestra evidencia verificable de las llamadas a la CMC API:
 * Endpoint, status code, latencia en ms, créditos consumidos y payload JSON.
 */
import { FaXmark } from 'react-icons/fa6'

export default function ApiInspector({ callLog = [], onClose }) {
  const last = callLog[callLog.length - 1] ?? null
  const totalCredits = callLog.reduce((sum, c) => sum + (c.credits ?? 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative bg-[#0c0c0e] border border-zinc-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col z-10 text-xs font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">CoinMarketCap API Inspector</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Auditoría y evidencia de llamadas reales a la Pro API
            </p>
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <span className="font-mono text-[11px]">
              Créditos consumidos: <strong className="text-zinc-100">{totalCredits}</strong>
            </span>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-200 text-sm p-1"
            >
              <FaXmark />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          {callLog.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No se han registrado llamadas a la API en esta sesión.
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead className="sticky top-0 bg-[#0c0c0e] border-b border-zinc-800 text-[11px] uppercase text-zinc-500">
                <tr>
                  <th className="px-3.5 py-2">Endpoint</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2">Créditos</th>
                  <th className="px-3.5 py-2">Latencia</th>
                  <th className="px-3.5 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-[11px]">
                {[...callLog].reverse().map((call, i) => (
                  <tr
                    key={i}
                    className="hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-3.5 py-2 text-zinc-200 truncate max-w-[220px]">
                      {call.endpoint}
                    </td>
                    <td className="px-3.5 py-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          call.status === 200
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-zinc-300">
                      {call.credits ?? '—'}
                    </td>
                    <td className="px-3.5 py-2 text-zinc-400">
                      {call.elapsed_ms}ms
                    </td>
                    <td className="px-3.5 py-2 text-zinc-500">
                      {call.timestamp?.split('T')[1]?.slice(0, 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Payload Preview */}
        {last && (
          <div className="border-t border-zinc-800 p-3.5 bg-zinc-950">
            <p className="text-[11px] text-zinc-400 font-mono mb-1.5">
              Última respuesta de la API: <span className="text-zinc-200">{last.endpoint}</span>
            </p>
            <pre className="bg-[#09090b] border border-zinc-800 rounded p-2.5 text-[11px] text-zinc-300 overflow-auto max-h-28 font-mono">
              {JSON.stringify(last.preview, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-zinc-800 px-4 py-2.5 bg-zinc-900/50 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>pro-api.coinmarketcap.com</span>
          <span>API Key protegida en el servidor</span>
        </div>
      </div>
    </div>
  )
}
