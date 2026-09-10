import { useState } from 'react'
import { router, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { FaCopy, FaCheck } from 'react-icons/fa6'

const SAMPLE_TOKENS = [
  {
    name: 'Uniswap',
    symbol: 'UNI',
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    desc: 'DEX Token principal en Ethereum',
    tag: 'DeFi',
    platform: 'ethereum',
  },
  {
    name: 'Pepe',
    symbol: 'PEPE',
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    desc: 'Alto volumen en Uniswap V3',
    tag: 'Meme',
    platform: 'ethereum',
  },
  {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    desc: 'Base de Liquidez DEX',
    tag: 'Base',
    platform: 'ethereum',
  },
  {
    name: 'Chainlink',
    symbol: 'LINK',
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    desc: 'Oráculo de precios',
    tag: 'Oráculo',
    platform: 'ethereum',
  },
  {
    name: 'AUSD (Agora)',
    symbol: 'AUSD',
    address: '0x00000000efe302beaa2b3e6e1b18d08d69a9012a',
    desc: 'Caso Elephant: análisis de acumulación',
    tag: 'Stablecoin',
    platform: 'ethereum',
  },
]

function fmtUsd(n) {
  if (n == null) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${n.toFixed(6)}`
}

export default function WhaleDetector({ receipt = null, callLog = [], searched = null }) {
  const [form, setForm] = useState({
    address: searched?.address || '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    symbol: searched?.symbol || 'UNI',
    platform: searched?.platform || 'ethereum',
    pages: searched?.pages || 8,
  })
  const [loading, setLoading] = useState(false)
  const [copiedWallet, setCopiedWallet] = useState('')

  function handleSelectSample(sample) {
    setForm({
      address: sample.address,
      symbol: sample.symbol,
      platform: sample.platform || 'ethereum',
      pages: 8,
    })
  }

  function analyze(e) {
    e.preventDefault()
    if (!form.address || !form.symbol) return
    setLoading(true)
    router.post('/whale-detector/analyze', form, {
      onFinish: () => setLoading(false),
    })
  }

  function downloadReceipt() {
    if (!receipt) return
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whale-receipt-${receipt.symbol}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyWallet(address) {
    navigator.clipboard.writeText(address)
    setCopiedWallet(address)
    setTimeout(() => setCopiedWallet(''), 2000)
  }

  const buyVol = receipt?.buy_volume || 0
  const sellVol = receipt?.sell_volume || 0
  const totalVol = buyVol + sellVol
  const buyPct = totalVol > 0 ? (buyVol / totalVol) * 100 : 50
  const sellPct = totalVol > 0 ? (sellVol / totalVol) * 100 : 50

  const maxTopPct = receipt ? Math.max(receipt.top_buy?.pct || 0, receipt.top_sell?.pct || 0) : 0

  return (
    <AppLayout callLog={callLog}>
      <Head title="DEX Whale Flow Detector" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            DEX Whale Flow Detector
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Auditoría de libro de transacciones DEX wallet por wallet. Detección de acumulación y distribución oculta.
          </p>
        </div>
      </div>

      {/* Explainer Card */}
      <div className="shadcn-card p-4 mb-5 text-xs text-zinc-300 space-y-1.5">
        <p className="font-semibold text-zinc-100">
          ¿Cómo funciona y de dónde sale la dirección del token?
        </p>
        <p className="text-zinc-400 leading-relaxed text-[11px]">
          Los gráficos comunes muestran solo si el flujo neto fue positivo o negativo. Pero ese dato no dice si fueron 200 inversores pequeños comprando o una sola ballena vendiendo millones. Whale Detector analiza los últimos 800 swaps del endpoint <span className="font-mono text-zinc-300">/v1/dex/tokens/transactions</span> y evalúa la concentración de cada billetera.
        </p>
        <p className="text-zinc-500 text-[11px]">
          La dirección del contrato es el ID del token en la blockchain. Puedes hacer clic en cualquiera de los 5 tokens preparados a continuación o pegar tu propia dirección.
        </p>
      </div>

      {/* Sample Token Chips */}
      <div className="mb-5">
        <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-2">
          Tokens populares (1 clic):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SAMPLE_TOKENS.map(token => (
            <button
              key={token.symbol}
              onClick={() => handleSelectSample(token)}
              className={`p-2.5 rounded-md text-left border transition-colors ${
                form.symbol === token.symbol
                  ? 'bg-zinc-800 border-zinc-600'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-zinc-100">{token.symbol}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                  {token.tag}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-1">{token.name}</p>
              <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">{token.address.slice(0, 8)}...</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={analyze} className="shadcn-card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-6">
            <label className="block text-[11px] text-zinc-400 mb-1">
              Dirección de Contrato (Ethereum)
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="0x00000000efe302beaa2b3e6e1b18d08d69a9012a"
              className="w-full shadcn-input px-3 py-1.5 text-xs font-mono text-zinc-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] text-zinc-400 mb-1">Símbolo</label>
            <input
              type="text"
              value={form.symbol}
              onChange={e => setForm({ ...form, symbol: e.target.value })}
              placeholder="AUSD"
              className="w-full shadcn-input px-3 py-1.5 text-xs font-mono font-bold text-zinc-100 uppercase"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] text-zinc-400 mb-1">Páginas de Swaps</label>
            <select
              value={form.pages}
              onChange={e => setForm({ ...form, pages: parseInt(e.target.value) })}
              className="w-full shadcn-input px-3 py-1.5 text-xs text-zinc-200"
            >
              <option value="4">400 swaps</option>
              <option value="8">800 swaps</option>
              <option value="12">1,200 swaps</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading || !form.address || !form.symbol}
              className="w-full shadcn-btn-primary py-1.5 px-3 text-xs font-medium disabled:opacity-50"
            >
              {loading ? 'Extrayendo…' : 'Auditar Cinta'}
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      {receipt ? (
        <div className="space-y-5">
          {/* Signal */}
          <div className={`p-4 rounded-md border text-xs ${
            receipt.signal?.level === 'danger'
              ? 'bg-rose-950/20 border-rose-800 text-rose-300'
              : receipt.signal?.level === 'warning'
                ? 'bg-amber-950/20 border-amber-800 text-amber-300'
                : 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-sm block text-zinc-100">{receipt.signal?.label}</span>
                <p className="text-zinc-300 mt-0.5">{receipt.signal?.message}</p>
              </div>

              <button
                onClick={downloadReceipt}
                className="shadcn-btn-secondary px-3 py-1 text-xs font-mono whitespace-nowrap self-start sm:self-auto"
              >
                Descargar Recibo JSON
              </button>
            </div>

            {receipt.signal?.rule && (
              <p className="mt-2 text-[11px] font-mono text-zinc-400 border-t border-zinc-800 pt-1.5">
                Regla ejecutada: {receipt.signal.rule}
              </p>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="shadcn-card p-3.5">
              <span className="text-xs text-zinc-400 font-medium">Swaps Analizados</span>
              <p className="text-xl font-bold font-mono text-zinc-100 mt-1">{receipt.total_swaps?.toLocaleString()}</p>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                {receipt.buy_count} buys · {receipt.sell_count} sells
              </span>
            </div>

            <div className="shadcn-card p-3.5">
              <span className="text-xs text-zinc-400 font-medium">Flujo Neto Oficial</span>
              <p className={`text-xl font-bold font-mono mt-1 ${
                (receipt.net_flow_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(receipt.net_flow_pct || 0) >= 0 ? '+' : ''}{receipt.net_flow_pct}%
              </p>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                Lectura estándar de screener
              </span>
            </div>

            <div className="shadcn-card p-3.5">
              <span className="text-xs text-zinc-400 font-medium">Concentración Máxima</span>
              <p className={`text-xl font-bold font-mono mt-1 ${
                maxTopPct >= 50 ? 'text-rose-400' : maxTopPct >= 30 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {maxTopPct.toFixed(1)}%
              </p>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                En 1 sola billetera
              </span>
            </div>

            <div className="shadcn-card p-3.5">
              <span className="text-xs text-zinc-400 font-medium">Billeteras Únicas</span>
              <p className="text-xl font-bold font-mono text-zinc-100 mt-1">
                {(receipt.buy_wallets || 0) + (receipt.sell_wallets || 0)}
              </p>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                {receipt.buy_wallets} buyers · {receipt.sell_wallets} sellers
              </span>
            </div>
          </div>

          {/* Volume Split Bar (Solid) */}
          <div className="shadcn-panel p-4">
            <h4 className="font-semibold text-xs uppercase font-mono tracking-wider text-zinc-300 mb-2">
              Desglose de Volumen (Buy vs Sell)
            </h4>

            <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-800">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${buyPct}%` }}
                title={`Buy: ${buyPct.toFixed(1)}%`}
              />
              <div
                className="h-full bg-rose-500"
                style={{ width: `${sellPct}%` }}
                title={`Sell: ${sellPct.toFixed(1)}%`}
              />
            </div>

            <div className="flex justify-between items-center text-xs font-mono mt-2.5">
              <span className="text-zinc-300">
                Buy: <strong className="text-emerald-400">{fmtUsd(receipt.buy_volume)}</strong> ({receipt.buy_wallets} wallets)
              </span>
              <span className="text-zinc-300">
                Sell: <strong className="text-rose-400">{fmtUsd(receipt.sell_volume)}</strong> ({receipt.sell_wallets} wallets)
              </span>
            </div>
          </div>

          {/* Top Wallets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Top Buyer */}
            <div className="shadcn-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-emerald-400 text-xs">Top Billetera Compradora</span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {receipt.top_buy?.pct ?? 0}% del total buy
                </span>
              </div>

              {receipt.top_buy?.wallet ? (
                <div className="space-y-2">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-zinc-300 break-all">{receipt.top_buy.wallet}</span>
                    <button
                      onClick={() => copyWallet(receipt.top_buy.wallet)}
                      className="text-zinc-500 hover:text-zinc-200 ml-2 shrink-0 flex items-center gap-1"
                    >
                      {copiedWallet === receipt.top_buy.wallet ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                      <span>{copiedWallet === receipt.top_buy.wallet ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-zinc-900 p-2 rounded">
                      <span className="text-zinc-500 text-[10px] block">Volumen</span>
                      <span className="text-emerald-400 font-semibold">{fmtUsd(receipt.top_buy.volume)}</span>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded">
                      <span className="text-zinc-500 text-[10px] block">Transacciones</span>
                      <span className="text-zinc-200">{receipt.top_buy.count} swaps</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500">Sin datos</p>
              )}
            </div>

            {/* Top Seller */}
            <div className="shadcn-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-rose-400 text-xs">Top Billetera Vendedora</span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {receipt.top_sell?.pct ?? 0}% del total sell
                </span>
              </div>

              {receipt.top_sell?.wallet ? (
                <div className="space-y-2">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-zinc-300 break-all">{receipt.top_sell.wallet}</span>
                    <button
                      onClick={() => copyWallet(receipt.top_sell.wallet)}
                      className="text-zinc-500 hover:text-zinc-200 ml-2 shrink-0 flex items-center gap-1"
                    >
                      {copiedWallet === receipt.top_sell.wallet ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                      <span>{copiedWallet === receipt.top_sell.wallet ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-zinc-900 p-2 rounded">
                      <span className="text-zinc-500 text-[10px] block">Volumen</span>
                      <span className="text-rose-400 font-semibold">{fmtUsd(receipt.top_sell.volume)}</span>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded">
                      <span className="text-zinc-500 text-[10px] block">Transacciones</span>
                      <span className="text-zinc-200">{receipt.top_sell.count} swaps</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="shadcn-panel p-8 text-center text-xs">
          <p className="text-zinc-400 mb-3">
            Selecciona un token de los chips de arriba o ingresa un contrato para iniciar la auditoría.
          </p>
          <button
            onClick={analyze}
            disabled={loading}
            className="shadcn-btn-primary px-4 py-2 text-xs font-medium"
          >
            Auditar Token ({form.symbol})
          </button>
        </div>
      )}
    </AppLayout>
  )
}
