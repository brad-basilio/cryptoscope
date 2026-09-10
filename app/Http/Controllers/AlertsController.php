<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Services\CmcClient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlertsController extends Controller
{
    public function __construct(private CmcClient $cmc) {}

    public function index(): \Inertia\Response
    {
        $userId = auth()->id();
        $alerts = $userId
            ? Alert::where('user_id', $userId)->latest()->get()->toArray()
            : [];

        $symbols = collect($alerts)->pluck('symbol')->unique()->values()->all();

        $prices = [];
        if (! empty($symbols)) {
            $quotesData = $this->cmc->quotes($symbols);
            $prices     = $quotesData['data'] ?? [];
        }

        $enriched = collect($alerts)->map(function ($alert) use ($prices) {
            $price     = $prices[$alert['symbol']]['quote']['USD']['price'] ?? null;
            $triggered = null;

            if ($price !== null) {
                $triggered = $alert['direction'] === 'above'
                    ? $price >= $alert['target']
                    : $price <= $alert['target'];
            }

            return array_merge($alert, [
                'current_price' => $price,
                'triggered'     => $triggered,
            ]);
        })->values()->all();

        return Inertia::render('Alerts', [
            'alerts'         => $enriched,
            'isAuthenticated'=> (bool) $userId,
            'callLog'        => $this->cmc->getCallLog(),
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->check()) {
            return back()->with('error', 'Inicia sesión para guardar tus alertas privadas.');
        }

        $validated = $request->validate([
            'symbol'    => 'required|string|max:20',
            'direction' => 'required|in:above,below',
            'target'    => 'required|numeric|min:0',
        ]);

        Alert::create([
            'user_id'   => auth()->id(),
            'symbol'    => strtoupper($validated['symbol']),
            'direction' => $validated['direction'],
            'target'    => $validated['target'],
        ]);

        return back()->with('success', 'Alerta creada.');
    }

    public function destroy(Alert $alert)
    {
        if ($alert->user_id && $alert->user_id !== auth()->id()) {
            abort(403, 'No autorizado.');
        }

        $alert->delete();
        return back()->with('success', 'Alerta eliminada.');
    }

    /**
     * Endpoint JSON llamado en segundo plano cada 25s por AppLayout.
     */
    public function check(): \Illuminate\Http\JsonResponse
    {
        $userId = auth()->id();
        if (!$userId) {
            return response()->json(['triggered' => [], 'count' => 0]);
        }

        $alerts = Alert::where('user_id', $userId)->where('triggered', false)->get();
        if ($alerts->isEmpty()) {
            return response()->json([
                'triggered' => [],
                'count'     => 0,
            ]);
        }

        $symbols = $alerts->pluck('symbol')->unique()->values()->all();
        $quotesData = $this->cmc->quotes($symbols);
        $prices = $quotesData['data'] ?? [];

        $triggeredList = [];

        foreach ($alerts as $alert) {
            $price = $prices[$alert->symbol]['quote']['USD']['price'] ?? null;
            if ($price !== null) {
                $isTriggered = $alert->direction === 'above'
                    ? $price >= $alert->target
                    : $price <= $alert->target;

                if ($isTriggered) {
                    if (! $alert->triggered) {
                        $alert->update(['triggered' => true]);
                    }

                    $triggeredList[] = [
                        'id'            => $alert->id,
                        'symbol'        => $alert->symbol,
                        'direction'     => $alert->direction,
                        'target'        => (float) $alert->target,
                        'current_price' => (float) $price,
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
