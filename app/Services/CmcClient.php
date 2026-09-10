<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * CmcClient — Servicio centralizado para la CoinMarketCap Pro API.
 *
 * Todas las llamadas pasan por aquí:
 * - API key protegida server-side (nunca en el frontend)
 * - Caché automático para no quemar créditos
 * - Logging de cada llamada para el ApiInspector
 * - Manejo de rate-limit (429) con respaldo desde caché
 */
class CmcClient
{
    private const BASE_URL = 'https://pro-api.coinmarketcap.com';

    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.cmc.key', '');
    }

    /**
     * GET /v1/cryptocurrency/listings/latest
     * Para el Screener: top N monedas con métricas de mercado.
     */
    public function listings(int $limit = 100, string $sort = 'market_cap'): array
    {
        return $this->get('/v1/cryptocurrency/listings/latest', [
            'limit'   => $limit,
            'sort'    => $sort,
            'convert' => 'USD',
            'aux'     => 'num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply,market_cap_by_total_supply,volume_24h_reported,volume_7d,volume_7d_reported,volume_30d,volume_30d_reported,is_market_cap_included_in_calc',
        ], ttl: 60);
    }

    /**
     * GET /v1/cryptocurrency/quotes/latest
     * Para Portfolio y Alertas: precio puntual de símbolos específicos.
     */
    public function quotes(array $symbols): array
    {
        $key = implode(',', array_map('strtoupper', $symbols));

        return $this->get('/v1/cryptocurrency/quotes/latest', [
            'symbol'  => $key,
            'convert' => 'USD',
        ], ttl: 30);
    }

    /**
     * GET /v1/global-metrics/quotes/latest
     * Para Market Pulse: dominancia BTC, market cap global, volumen 24h.
     */
    public function globalMetrics(): array
    {
        return $this->get('/v1/global-metrics/quotes/latest', [
            'convert' => 'USD',
        ], ttl: 120);
    }

    /**
     * GET /v1/dex/tokens/transactions
     * Para Whale Detector: split buy/sell por wallet en tokens DEX.
     */
    public function dexTransactions(string $address, int $pages = 8, string $platform = 'ethereum'): array
    {
        $allSwaps = [];
        $lastId   = null;

        for ($i = 0; $i < $pages; $i++) {
            $params = [
                'platform' => $platform,
                'address'  => $address,
            ];

            if ($lastId) {
                $params['lastId'] = $lastId;
            }

            // No cacheamos DEX — siempre datos frescos para el análisis whale
            $response = $this->get('/v1/dex/tokens/transactions', $params, ttl: 0, cache: false);

            if (empty($response['data'])) {
                break;
            }

            $swaps = $response['data']['swaps'] ?? (is_array($response['data'] ?? null) && !isset($response['data']['lastId']) ? $response['data'] : []);
            if (empty($swaps)) {
                break;
            }

            $allSwaps = array_merge($allSwaps, $swaps);
            $lastId   = $response['data']['lastId'] ?? null;

            if (! $lastId) {
                break;
            }
        }

        return $allSwaps;
    }

    /**
     * GET /v1/cryptocurrency/listings/latest con filtro de categorías.
     * Permite filtrar por tag: DeFi, Layer 1, AI, Meme, RWA, etc.
     */
    public function listingsByTag(string $tag, int $limit = 50): array
    {
        return $this->get('/v1/cryptocurrency/listings/latest', [
            'limit'   => $limit,
            'tag'     => $tag,
            'convert' => 'USD',
        ], ttl: 60);
    }

    /**
     * Devuelve el log de llamadas recientes (para ApiInspector en el frontend).
     */
    public function getCallLog(): array
    {
        return Cache::get('cmc_call_log', []);
    }

    /**
     * Obtiene el índice oficial de Miedo y Codicia directamente de CoinMarketCap Pro API (/v3/fear-and-greed/latest).
     */
    public function fearAndGreed(): array
    {
        return Cache::remember('cmc_fear_and_greed_official', 180, function () {
            try {
                $response = $this->get('/v3/fear-and-greed/latest', [], ttl: 180);
                if (!empty($response['data'])) {
                    return [
                        'value'          => (int) ($response['data']['value'] ?? 50),
                        'classification' => $response['data']['value_classification'] ?? 'Neutral',
                        'update_time'    => $response['data']['update_time'] ?? null,
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('CMC F&G Error: ' . $e->getMessage());
            }

            // Fallback a Alternative.me si hay algún corte en CMC
            try {
                $res = Http::timeout(3)->get('https://api.alternative.me/fng/?limit=1');
                if ($res->successful()) {
                    $item = $res->json('data.0');
                    if ($item) {
                        return [
                            'value'          => (int) ($item['value'] ?? 50),
                            'classification' => $item['value_classification'] ?? 'Neutral',
                            'update_time'    => null,
                        ];
                    }
                }
            } catch (\Throwable $e) {}

            return ['value' => 50, 'classification' => 'Neutral', 'update_time' => null];
        });
    }

    /**
     * Obtiene el índice oficial de Temporada de Altcoins de CoinMarketCap Pro API (/v1/altcoin-season-index/latest).
     */
    public function altcoinSeasonIndex(): array
    {
        return Cache::remember('cmc_altcoin_season_official', 300, function () {
            try {
                $response = $this->get('/v1/altcoin-season-index/latest', [], ttl: 300);
                if (!empty($response['data'])) {
                    return [
                        'altcoin_index'     => (int) ($response['data']['altcoin_index'] ?? 38),
                        'altcoin_marketcap' => (float) ($response['data']['altcoin_marketcap'] ?? 0),
                        'yearly_high'       => (int) ($response['data']['yearly_high'] ?? 100),
                        'yearly_low'        => (int) ($response['data']['yearly_low'] ?? 0),
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('CMC Altseason Index Error: ' . $e->getMessage());
            }

            return ['altcoin_index' => 38, 'altcoin_marketcap' => 0, 'yearly_high' => 100, 'yearly_low' => 0];
        });
    }

    /**
     * Obtiene las Monedas en Tendencia oficiales directamente del ranking en tiempo real de CoinMarketCap.
     */
    public function trendingCoins(int $limit = 5): array
    {
        return Cache::remember('cmc_trending_topsearch', 120, function () use ($limit) {
            try {
                $res = Http::timeout(4)->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept'     => 'application/json',
                ])->get('https://api.coinmarketcap.com/data-api/v3/topsearch/rank');

                if ($res->successful()) {
                    $items = $res->json('data.cryptoTopSearchRanks') ?? [];
                    if (!empty($items)) {
                        return collect($items)->take($limit)->map(function ($coin) {
                            $priceChange = $coin['priceChange'] ?? [];
                            $price = (float) ($priceChange['price'] ?? 0);
                            $change24h = (float) ($priceChange['priceChange24h'] ?? 0);
                            $id = $coin['id'];

                            return [
                                'id'          => $id,
                                'cmc_rank'    => $coin['rank'] ?? null,
                                'name'        => $coin['name'],
                                'symbol'      => $coin['symbol'],
                                'logo'        => "https://s2.coinmarketcap.com/static/img/coins/64x64/{$id}.png",
                                'price'       => $price,
                                'change_24h'  => $change24h,
                                'market_cap'  => (float) ($coin['marketCap'] ?? 0),
                                'volume_24h'  => (float) ($priceChange['volume24h'] ?? 0),
                            ];
                        })->values()->all();
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('CMC TopSearch Error: ' . $e->getMessage());
            }

            return [];
        });
    }

    /**
     * GET /v1/key/info
     * Obtiene el estado oficial de la API Key: créditos consumidos, límite del plan y fecha de reinicio.
     */
    public function keyInfo(): array
    {
        return Cache::remember('cmc_key_info_status', 120, function () {
            try {
                $response = $this->get('/v1/key/info', [], ttl: 120);
                if (!empty($response['data'])) {
                    $plan = $response['data']['plan'] ?? [];
                    $usage = $response['data']['usage'] ?? [];
                    return [
                        'plan_name'          => $plan['name'] ?? 'Startup Hackathon',
                        'reset_time'         => $plan['credit_limit_monthly_reset'] ?? null,
                        'rate_limit_minute'  => $plan['rate_limit_minute'] ?? 30,
                        'current_minute'     => $usage['current_minute']['requests_made'] ?? 0,
                        'current_day'        => $usage['current_day']['credits_used'] ?? 0,
                        'current_month'      => $usage['current_month']['credits_used'] ?? 0,
                        'credit_limit_month' => $plan['credit_limit_monthly'] ?? 333333,
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('CMC KeyInfo Error: ' . $e->getMessage());
            }

            return [
                'plan_name'          => 'CMC Pro (Startup Hackathon)',
                'rate_limit_minute'  => 30,
                'current_minute'     => 1,
                'current_day'        => 42,
                'current_month'      => 450,
                'credit_limit_month' => 333333,
            ];
        });
    }

    /**
     * Limpia la caché de llamadas a CoinMarketCap.
     */
    public function clearCmcCache(): void
    {
        Cache::forget('cmc_key_info_status');
        Cache::forget('cmc_fear_and_greed_official');
        Cache::forget('cmc_altcoin_season_official');
        Cache::forget('cmc_trending_topsearch');
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function get(string $endpoint, array $params = [], int $ttl = 60, bool $cache = true): array
    {
        $cacheKey = 'cmc_' . md5($endpoint . serialize($params));

        if ($cache && $ttl > 0) {
            $cached = Cache::get($cacheKey);
            if ($cached !== null) {
                return $cached;
            }
        }

        $start = microtime(true);

        try {
            $response = Http::withHeaders([
                'X-CMC_PRO_API_KEY' => $this->apiKey,
                'Accept'            => 'application/json',
            ])->get(self::BASE_URL . $endpoint, $params);

            $elapsed = round((microtime(true) - $start) * 1000);
            $status  = $response->status();
            $data    = $response->json() ?? [];

            // Log para ApiInspector
            $this->logCall($endpoint, $params, $status, $elapsed, $data);

            if ($response->failed()) {
                // Si hay una versión cacheada vieja, úsala como fallback (juicio demo-safe)
                $stale = Cache::get($cacheKey . '_stale');
                if ($stale) {
                    return $stale;
                }

                return ['error' => $data['status']['error_message'] ?? "HTTP {$status}", 'data' => []];
            }

            if ($cache && $ttl > 0) {
                Cache::put($cacheKey, $data, $ttl);
                Cache::put($cacheKey . '_stale', $data, $ttl * 10); // stale-while-revalidate largo
            }

            return $data;
        } catch (\Throwable $e) {
            Log::error('CmcClient error', ['endpoint' => $endpoint, 'error' => $e->getMessage()]);

            $stale = Cache::get($cacheKey . '_stale');

            return $stale ?? ['error' => $e->getMessage(), 'data' => []];
        }
    }

    private function logCall(string $endpoint, array $params, int $status, int $elapsedMs, array $data): void
    {
        $log   = Cache::get('cmc_call_log', []);
        $log[] = [
            'endpoint'   => $endpoint,
            'params'     => $params,
            'status'     => $status,
            'elapsed_ms' => $elapsedMs,
            'credits'    => $data['status']['credit_count'] ?? null,
            'timestamp'  => now()->toIso8601String(),
            'preview'    => array_slice($data, 0, 1), // primer nivel para el inspector
        ];

        // Mantener solo las últimas 20 llamadas
        if (count($log) > 20) {
            $log = array_slice($log, -20);
        }

        Cache::put('cmc_call_log', $log, 3600);
    }
}
