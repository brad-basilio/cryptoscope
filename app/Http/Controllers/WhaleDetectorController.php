<?php

namespace App\Http\Controllers;

use App\Services\CmcClient;
use App\Services\WhaleAnalyzer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WhaleDetectorController extends Controller
{
    public function __construct(
        private CmcClient $cmc,
        private WhaleAnalyzer $analyzer,
    ) {}

    public function index(): \Inertia\Response
    {
        return Inertia::render('WhaleDetector', [
            'receipt' => null,
            'callLog' => $this->cmc->getCallLog(),
        ]);
    }

    public function analyze(Request $request): \Inertia\Response
    {
        $validated = $request->validate([
            'address'  => 'required|string|max:100',
            'symbol'   => 'required|string|max:20',
            'platform' => 'nullable|string|max:50',
            'pages'    => 'nullable|integer|min:1|max:20',
        ]);

        $platform = $validated['platform'] ?? 'ethereum';
        $pages    = $validated['pages'] ?? 8;
        $swaps    = $this->cmc->dexTransactions($validated['address'], $pages, $platform);
        $receipt  = $this->analyzer->analyze($swaps, $validated['symbol']);

        return Inertia::render('WhaleDetector', [
            'receipt'  => $receipt,
            'callLog'  => $this->cmc->getCallLog(),
            'searched' => [
                'address'  => $validated['address'],
                'symbol'   => $validated['symbol'],
                'platform' => $platform,
                'pages'    => $pages,
            ],
        ]);
    }
}
