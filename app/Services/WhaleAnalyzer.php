<?php

namespace App\Services;

/**
 * WhaleAnalyzer — Analiza el split buy/sell de transacciones DEX.
 *
 * Esta clase implementa la misma lógica que Elephant Tracks (CLI Python)
 * pero la expone como un servicio PHP con resultado estructurado
 * para renderizar en el frontend React (Whale Detector page).
 */
class WhaleAnalyzer
{
    /**
     * Analiza un array de swaps DEX y devuelve el split buy/sell
     * con detección de concentración de wallets (ballenas).
     *
     * @param array  $swaps    Datos de /v1/dex/tokens/transactions
     * @param string $symbol   Símbolo del token (ej. "AUSD")
     * @return array           Receipt estructurado con métricas y señal
     */
    public function analyze(array $swaps, string $symbol): array
    {
        if (empty($swaps)) {
            return $this->emptyResult($symbol);
        }

        $buys  = [];
        $sells = [];

        foreach ($swaps as $swap) {
            $side   = strtolower($swap['side'] ?? $swap['type'] ?? $swap['tp'] ?? '');
            $wallet = $swap['maker'] ?? $swap['wallet_address'] ?? $swap['from'] ?? $swap['ma'] ?? 'unknown';
            $volume = (float) ($swap['v'] ?? $swap['volume_usd'] ?? $swap['amount_usd'] ?? 0);
            $tx     = $swap['tx'] ?? $swap['hash'] ?? null;
            $ts     = $swap['ts'] ?? null;

            if ($volume <= 0) {
                continue;
            }

            $entry = [
                'wallet'    => $wallet,
                'volume'    => $volume,
                'tx'        => $tx,
                'timestamp' => $ts,
            ];

            if ($side === 'buy') {
                $buys[] = $entry;
            } elseif ($side === 'sell') {
                $sells[] = $entry;
            }
        }

        $buyVol  = array_sum(array_column($buys, 'volume'));
        $sellVol = array_sum(array_column($sells, 'volume'));

        // Agrupar por wallet
        $buyByWallet  = $this->groupByWallet($buys);
        $sellByWallet = $this->groupByWallet($sells);

        // Top wallet en cada lado
        $topBuy  = $this->topWallet($buyByWallet, $buyVol);
        $topSell = $this->topWallet($sellByWallet, $sellVol);

        // Net flow (como porcentaje)
        $totalVol = $buyVol + $sellVol;
        $netFlow  = $totalVol > 0 ? (($buyVol - $sellVol) / $totalVol) * 100 : 0;

        // Señal de alerta (replica la lógica HERO de Elephant Tracks)
        $signal = $this->detectSignal($topBuy, $topSell, $netFlow);

        return [
            'symbol'         => strtoupper($symbol),
            'total_swaps'    => count($swaps),
            'buy_count'      => count($buys),
            'sell_count'     => count($sells),
            'buy_wallets'    => count($buyByWallet),
            'sell_wallets'   => count($sellByWallet),
            'buy_volume'     => $buyVol,
            'sell_volume'    => $sellVol,
            'avg_buy'        => count($buys) > 0 ? $buyVol / count($buys) : 0,
            'avg_sell'       => count($sells) > 0 ? $sellVol / count($sells) : 0,
            'net_flow_pct'   => round($netFlow, 2),
            'top_buy'        => $topBuy,
            'top_sell'       => $topSell,
            'signal'         => $signal,
            'buy_by_wallet'  => array_slice($buyByWallet, 0, 10),
            'sell_by_wallet' => array_slice($sellByWallet, 0, 10),
            'timestamp'      => now()->toIso8601String(),
        ];
    }

    private function groupByWallet(array $swaps): array
    {
        $grouped = [];

        foreach ($swaps as $swap) {
            $w = $swap['wallet'];
            if (! isset($grouped[$w])) {
                $grouped[$w] = ['wallet' => $w, 'volume' => 0, 'count' => 0];
            }
            $grouped[$w]['volume'] += $swap['volume'];
            $grouped[$w]['count']++;
        }

        // Ordenar descendente por volumen
        usort($grouped, fn ($a, $b) => $b['volume'] <=> $a['volume']);

        return $grouped;
    }

    private function topWallet(array $byWallet, float $totalVol): array
    {
        if (empty($byWallet) || $totalVol <= 0) {
            return ['wallet' => null, 'volume' => 0, 'pct' => 0, 'count' => 0];
        }

        $top = $byWallet[0];

        return [
            'wallet' => $top['wallet'],
            'volume' => $top['volume'],
            'pct'    => round(($top['volume'] / $totalVol) * 100, 1),
            'count'  => $top['count'],
        ];
    }

    private function detectSignal(array $topBuy, array $topSell, float $netFlow): array
    {
        // Régla HERO: concentración > 40% en cualquier lado con net flow < 5% → alerta
        $maxConcentration = max($topBuy['pct'] ?? 0, $topSell['pct'] ?? 0);
        $absNetFlow       = abs($netFlow);

        if ($maxConcentration >= 50 && $absNetFlow < 5) {
            $side = ($topSell['pct'] ?? 0) > ($topBuy['pct'] ?? 0) ? 'sell' : 'buy';
            return [
                'level'   => 'danger',
                'label'   => 'Acumulación/Distribución Detectada',
                'message' => "Una wallet concentra el {$maxConcentration}% del lado {$side} mientras el flujo neto parece neutral ({$netFlow}%). Señal similar a Elephant Tracks HERO.",
                'rule'    => "top_wallet_concentration >= 50% AND abs(net_flow) < 5%",
            ];
        }

        if ($maxConcentration >= 30 && $absNetFlow < 10) {
            return [
                'level'   => 'warning',
                'label'   => 'Alta Concentración — Vigilar',
                'message' => "Una wallet controla el {$maxConcentration}% del volumen. Puede ser market maker o ballena posicionándose.",
                'rule'    => "top_wallet_concentration >= 30% AND abs(net_flow) < 10%",
            ];
        }

        return [
            'level'   => 'normal',
            'label'   => 'Flujo Normal',
            'message' => "Distribución saludable de wallets. Top wallet: {$maxConcentration}%. Sin señales de manipulación detectadas.",
            'rule'    => "top_wallet_concentration < 30%",
        ];
    }

    private function emptyResult(string $symbol): array
    {
        return [
            'symbol'       => strtoupper($symbol),
            'total_swaps'  => 0,
            'signal'       => [
                'level'   => 'normal',
                'label'   => 'Sin datos',
                'message' => 'No se encontraron transacciones recientes en DEX para este token.',
                'rule'    => '',
            ],
        ];
    }
}
