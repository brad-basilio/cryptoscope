<?php

namespace App\Http\Controllers;

use App\Services\CmcClient;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ScreenerController extends Controller
{
    public function __construct(private CmcClient $cmc) {}

    public function index(Request $request): \Inertia\Response
    {
        $limit = (int) $request->get('limit', 100);
        $sort  = $request->get('sort', 'market_cap');
        $tag   = $request->get('tag', '');

        $data = $tag
            ? $this->cmc->listingsByTag($tag, $limit)
            : $this->cmc->listings($limit, $sort);

        // Métricas globales reales directo del endpoint /v1/global-metrics/quotes/latest de CMC
        $globalRaw = $this->cmc->globalMetrics();
        $globalData = $globalRaw['data'] ?? [];
        $globalQuote = $globalData['quote']['USD'] ?? [];

        $btcDom = (float) ($globalData['btc_dominance'] ?? 0);
        $ethDom = (float) ($globalData['eth_dominance'] ?? 0);

        // Índice oficial de Temporada de Altcoins consumido directamente de CMC (/v1/altcoin-season-index/latest)
        $altseasonData = $this->cmc->altcoinSeasonIndex();
        $altseasonScore = (int) ($altseasonData['altcoin_index'] ?? 38);

        // Índice real de Fear & Greed consumido de API de mercado
        $fng = $this->cmc->fearAndGreed();
        $fearGreedScore = $fng['value'] ?? 50;
        $fearGreedLabel = $fng['classification'] ?? 'Neutral';

        $coinsRaw = $data['data'] ?? [];

        $coins = collect($coinsRaw)->map(function ($coin) {
            $q = $coin['quote']['USD'] ?? [];
            $price = (float) ($q['price'] ?? 0);

            $p1h  = (float) ($q['percent_change_1h'] ?? 0);
            $p24h = (float) ($q['percent_change_24h'] ?? 0);
            $p7d  = (float) ($q['percent_change_7d'] ?? 0);

            // Reconstrucción de 4 puntos históricos de precio a partir de los
            // porcentajes reales que devuelve la API (1h, 24h, 7d).
            // P_histórico = P_actual / (1 + pct/100)
            $sparkline = [
                $p7d  != 0 ? round($price / (1 + $p7d  / 100), 6) : round($price * 0.97, 6),
                $p24h != 0 ? round($price / (1 + $p24h / 100), 6) : round($price * 0.99, 6),
                $p1h  != 0 ? round($price / (1 + $p1h  / 100), 6) : round($price * 0.999, 6),
                round($price, 6),
            ];

            // Suministro y riesgo de dilución
            $circulating = (float) ($coin['circulating_supply'] ?? 0);
            $maxSupply   = (float) ($coin['max_supply'] ?? $coin['total_supply'] ?? 0);
            $circulatingPct = $maxSupply > 0 ? min(100, round(($circulating / $maxSupply) * 100, 1)) : 100;

            // Motor Predictivo Cuantitativo (Trend & Opportunity Score)
            $score = 50;
            // Factor 1: Momentum (1h, 24h, 7d)
            if ($p24h > 0) $score += min(20, $p24h * 1.5);
            else $score -= min(25, abs($p24h) * 1.5);

            if ($p7d > 0) $score += min(15, $p7d * 0.8);
            else $score -= min(15, abs($p7d) * 0.8);

            // Factor 2: Dilución (si casi todo está emitido, menos presión vendedora futura)
            if ($circulatingPct > 80) $score += 10;
            elseif ($circulatingPct < 30) $score -= 15;

            // Factor 3: Anomalía de volumen
            $volMcap = (($q['volume_24h'] ?? 0) > 0 && ($q['market_cap'] ?? 0) > 0)
                ? $q['volume_24h'] / $q['market_cap']
                : 0;

            if ($volMcap > 0.15 && $p24h > 0) $score += 10; // Acumulación institucional
            elseif ($volMcap > 0.20 && $p24h < 0) $score -= 15; // Distribución masiva

            $score = max(5, min(95, round($score)));

            $prediction = [
                'score'       => $score,
                'sentiment'   => $score >= 65 ? 'BULLISH' : ($score <= 40 ? 'BEARISH' : 'NEUTRAL'),
                'label'       => $score >= 65 ? 'Probabilidad Alcista' : ($score <= 40 ? 'Riesgo de Corrección' : 'Consolidación Neutral'),
                'explanation' => $score >= 65
                    ? 'Momento positivo y absorción de volumen con baja presión de emisión.'
                    : ($score <= 40
                        ? 'Presión vendedora o riesgo de dilución por suministro bloqueado.'
                        : 'Estructura lateral, a la espera de confirmación de volumen.'),
            ];

            return [
                'id'             => $coin['id'],
                'cmc_rank'       => $coin['cmc_rank'] ?? null,
                'name'           => $coin['name'],
                'symbol'         => $coin['symbol'],
                'logo'           => "https://s2.coinmarketcap.com/static/img/coins/64x64/{$coin['id']}.png",
                'cmc_sparkline'  => "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/{$coin['id']}.svg",
                'price'          => $price,
                'market_cap'     => (float) ($q['market_cap'] ?? 0),
                'volume_24h'     => (float) ($q['volume_24h'] ?? 0),
                'change_1h'      => $p1h,
                'change_24h'     => $p24h,
                'change_7d'      => $p7d,
                'vol_mcap_ratio' => $volMcap,
                'circulating_supply' => $circulating,
                'max_supply'     => $maxSupply,
                'circulating_pct'=> $circulatingPct,
                'sparkline'      => $sparkline,
                'prediction'     => $prediction,
                'tags'           => $coin['tags'] ?? [],
            ];
        })->values()->all();

        // Monedas en Tendencia: obtenidas directamente de CoinMarketCap (TopSearch / Trending oficial)
        $trendingCoins = $this->cmc->trendingCoins(5);

        // Si por alguna razón no hay respuesta externa, usar fallback inteligente de los coins listados
        if (empty($trendingCoins)) {
            $trendingCoins = collect($coins)
                ->map(function ($c) {
                    $changeScore = abs($c['change_24h'] ?? 0) * 1.5;
                    $volScore = min(50, ($c['vol_mcap_ratio'] ?? 0) * 200);
                    $c['trending_score'] = $changeScore + $volScore;
                    return $c;
                })
                ->sortByDesc('trending_score')
                ->take(5)
                ->values()
                ->all();
        }

        $marketCapChange24h = (float) ($globalQuote['total_market_cap_yesterday_percentage_change'] ?? 0);

        return Inertia::render('Screener', [
            'coins'          => $coins,
            'trendingCoins'  => $trendingCoins,
            'macroStatus'    => [
                'fear_greed'            => $fearGreedScore,
                'fear_greed_label'      => $fearGreedLabel,
                'altseason_index'       => $altseasonScore,
                'btc_dominance'         => $btcDom,
                'eth_dominance'         => $ethDom,
                'total_market_cap'      => (float) ($globalQuote['total_market_cap'] ?? 0),
                'total_volume_24h'      => (float) ($globalQuote['total_volume_24h'] ?? 0),
                'market_cap_change_24h' => $marketCapChange24h,
            ],
            'callLog'        => $this->cmc->getCallLog(),
            'activeTag'      => $tag,
            'activeSort'     => $sort,
        ]);
    }
}
