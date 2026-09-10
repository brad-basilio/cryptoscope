<?php

namespace App\Http\Controllers;

use App\Services\CmcClient;
use Inertia\Inertia;

class MarketPulseController extends Controller
{
    public function __construct(private CmcClient $cmc) {}

    public function index(): \Inertia\Response
    {
        $raw  = $this->cmc->globalMetrics();
        $data = $raw['data'] ?? [];
        $q    = $data['quote']['USD'] ?? [];

        $metrics = [
            'btc_dominance'           => $data['btc_dominance'] ?? null,
            'eth_dominance'           => $data['eth_dominance'] ?? null,
            'total_market_cap'        => $q['total_market_cap'] ?? null,
            'total_volume_24h'        => $q['total_volume_24h'] ?? null,
            'active_cryptocurrencies' => $data['active_cryptocurrencies'] ?? null,
            'active_exchanges'        => $data['active_exchanges'] ?? null,
            'last_updated'            => $data['last_updated'] ?? null,
        ];

        return Inertia::render('MarketPulse', [
            'metrics' => $metrics,
            'callLog' => $this->cmc->getCallLog(),
        ]);
    }
}
