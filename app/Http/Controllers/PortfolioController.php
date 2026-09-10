<?php

namespace App\Http\Controllers;

use App\Models\Holding;
use App\Models\PortfolioTarget;
use App\Services\CmcClient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PortfolioController extends Controller
{
    public function __construct(private CmcClient $cmc) {}

    public function index(): \Inertia\Response
    {
        $userId = auth()->id();

        // Si el usuario no ha iniciado sesión, no tiene holdings guardados en su cuenta privada
        $holdings = $userId
            ? Holding::where('user_id', $userId)->with('targets')->get()->toArray()
            : [];

        $symbols = collect($holdings)->pluck('symbol')->unique()->values()->all();

        $prices = [];
        $cmcIds = []; // symbol => cmc_id mapping
        if (! empty($symbols)) {
            $quotesData = $this->cmc->quotes($symbols);
            $pricesRaw  = $quotesData['data'] ?? [];
            foreach ($pricesRaw as $sym => $info) {
                $prices[$sym] = $info;
                $cmcIds[$sym] = $info['id'] ?? null;
            }
        }

        $rows = collect($holdings)->map(function ($h) use ($prices, $cmcIds) {
            $symData      = $prices[$h['symbol']] ?? [];
            $live         = $symData['quote']['USD']['price'] ?? null;
            $change24h    = $symData['quote']['USD']['percent_change_24h'] ?? null;
            $change7d     = $symData['quote']['USD']['percent_change_7d'] ?? null;
            $currentValue = $live ? $live * $h['amount'] : null;
            $costValue    = $h['cost_basis'] * $h['amount'];
            $pnl          = $currentValue !== null ? $currentValue - $costValue : null;
            $pnlPct       = ($currentValue !== null && $costValue > 0)
                            ? ($pnl / $costValue) * 100 : null;

            $cmcId = $cmcIds[$h['symbol']] ?? null;

            return array_merge($h, [
                'live'          => $live,
                'change_24h'    => $change24h,
                'change_7d'     => $change7d,
                'current_value' => $currentValue,
                'cost_value'    => $costValue,
                'pnl'           => $pnl,
                'pnl_pct'       => $pnlPct,
                'logo'          => $cmcId ? "https://s2.coinmarketcap.com/static/img/coins/64x64/{$cmcId}.png" : null,
                'cmc_sparkline' => $cmcId ? "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/{$cmcId}.svg" : null,
            ]);
        })->values()->all();

        return Inertia::render('Portfolio', [
            'rows'           => $rows,
            'isAuthenticated'=> (bool) $userId,
            'callLog'        => $this->cmc->getCallLog(),
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->check()) {
            return back()->with('error', 'Debes iniciar sesión para registrar y proteger tus posiciones.');
        }

        $validated = $request->validate([
            'symbol'     => 'required|string|max:20',
            'amount'     => 'required|numeric|min:0.000001',
            'cost_basis' => 'required|numeric|min:0',
        ]);

        Holding::create([
            'user_id'    => auth()->id(),
            'symbol'     => strtoupper($validated['symbol']),
            'amount'     => $validated['amount'],
            'cost_basis' => $validated['cost_basis'],
        ]);

        return back()->with('success', 'Posición agregada a tu portafolio privado.');
    }

    public function destroy(Holding $holding)
    {
        if ($holding->user_id && $holding->user_id !== auth()->id()) {
            abort(403, 'No tienes autorización para eliminar esta posición.');
        }

        $holding->delete();
        return back()->with('success', 'Posición eliminada.');
    }

    /**
     * Crear un target (Take-Profit o Stop-Loss) para una posición.
     */
    public function storeTarget(Request $request)
    {
        if (!auth()->check()) {
            return back()->with('error', 'Debes iniciar sesión.');
        }

        $validated = $request->validate([
            'holding_id' => 'required|exists:holdings,id',
            'type'       => 'required|in:take_profit,stop_loss',
            'mode'       => 'required|in:price,percent',
            'value'      => 'required|numeric',
        ]);

        // Verificar propiedad del holding
        $holding = Holding::findOrFail($validated['holding_id']);
        if ($holding->user_id && $holding->user_id !== auth()->id()) {
            abort(403, 'No autorizado.');
        }

        PortfolioTarget::create($validated);

        return back()->with('success', 'Objetivo registrado.');
    }

    /**
     * Eliminar un target.
     */
    public function destroyTarget(PortfolioTarget $target)
    {
        $target->delete();
        return back()->with('success', 'Objetivo eliminado.');
    }

    /**
     * Endpoint para evaluar targets del portfolio en background.
     */
    public function checkTargets(): \Illuminate\Http\JsonResponse
    {
        $userId = auth()->id();
        if (!$userId) {
            return response()->json(['triggered' => [], 'count' => 0]);
        }

        $holdings = Holding::where('user_id', $userId)
            ->with(['targets' => fn($q) => $q->where('triggered', false)])
            ->get();
        $symbols  = $holdings->pluck('symbol')->unique()->values()->all();

        if (empty($symbols)) {
            return response()->json(['triggered' => [], 'count' => 0]);
        }

        $quotesData = $this->cmc->quotes($symbols);
        $prices     = $quotesData['data'] ?? [];

        $triggeredList = [];

        foreach ($holdings as $holding) {
            $live = $prices[$holding->symbol]['quote']['USD']['price'] ?? null;
            if ($live === null) continue;

            $costValue    = $holding->cost_basis * $holding->amount;
            $currentValue = $live * $holding->amount;
            $pnl          = $currentValue - $costValue;
            $pnlPct       = $costValue > 0 ? ($pnl / $costValue) * 100 : 0;

            foreach ($holding->targets as $target) {
                $hit = false;

                if ($target->type === 'take_profit') {
                    if ($target->mode === 'price') {
                        $hit = $live >= $target->value;
                    } else { // percent
                        $hit = $pnlPct >= $target->value;
                    }
                } else { // stop_loss
                    if ($target->mode === 'price') {
                        $hit = $live <= $target->value;
                    } else { // percent
                        $hit = $pnlPct <= -abs($target->value);
                    }
                }

                if ($hit) {
                    $target->update(['triggered' => true]);

                    $triggeredList[] = [
                        'id'            => $target->id,
                        'holding_id'    => $holding->id,
                        'symbol'        => $holding->symbol,
                        'type'          => $target->type,
                        'mode'          => $target->mode,
                        'target_value'  => (float) $target->value,
                        'current_price' => (float) $live,
                        'pnl'           => round($pnl, 2),
                        'pnl_pct'       => round($pnlPct, 2),
                    ];
                }
            }
        }

        return response()->json([
            'triggered' => $triggeredList,
            'count'     => count($triggeredList),
        ]);
    }
}
