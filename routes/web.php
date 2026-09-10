<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScreenerController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\AlertsController;
use App\Http\Controllers\MarketPulseController;
use App\Http\Controllers\WhaleDetectorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CryptoScope Routes
| Build with CMC Hackathon — Sept 2026
|--------------------------------------------------------------------------
*/

// Redirige la raíz al screener
Route::get('/', fn () => redirect('/screener'));

// Screener — /v1/cryptocurrency/listings/latest
Route::get('/screener', [ScreenerController::class, 'index'])->name('screener');

// Portfolio — /v1/cryptocurrency/quotes/latest + SQLite holdings
Route::get('/portfolio', [PortfolioController::class, 'index'])->name('portfolio');
Route::post('/portfolio/holdings', [PortfolioController::class, 'store'])->name('portfolio.store');
Route::delete('/portfolio/holdings/{holding}', [PortfolioController::class, 'destroy'])->name('portfolio.destroy');
Route::post('/portfolio/targets', [PortfolioController::class, 'storeTarget'])->name('portfolio.target.store');
Route::delete('/portfolio/targets/{target}', [PortfolioController::class, 'destroyTarget'])->name('portfolio.target.destroy');
Route::get('/api/portfolio/check-targets', [PortfolioController::class, 'checkTargets'])->name('portfolio.check-targets');

// Alertas — /v1/cryptocurrency/quotes/latest + SQLite alerts
Route::get('/alerts', [AlertsController::class, 'index'])->name('alerts');
Route::post('/alerts', [AlertsController::class, 'store'])->name('alerts.store');
Route::delete('/alerts/{alert}', [AlertsController::class, 'destroy'])->name('alerts.destroy');
Route::get('/api/alerts/check', [AlertsController::class, 'check'])->name('alerts.check');

// Market Pulse — /v1/global-metrics/quotes/latest
Route::get('/market-pulse', [MarketPulseController::class, 'index'])->name('market-pulse');

// Whale Detector — /v1/dex/tokens/transactions (el diferenciador vs Elephant Tracks)
Route::get('/whale-detector', [WhaleDetectorController::class, 'index'])->name('whale-detector');
Route::post('/whale-detector/analyze', [WhaleDetectorController::class, 'analyze'])->name('whale-detector.analyze');

// Perfil de usuario (Breeze)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Consola de Telemetría & Super Admin (CoinMarketCap API Audit)
Route::middleware(['auth', 'super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('dashboard');
    Route::post('/purge-cache', [AdminController::class, 'purgeCache'])->name('purge-cache');
    Route::post('/users/{user}/toggle-role', [AdminController::class, 'toggleUserRole'])->name('users.toggle-role');
});

require __DIR__.'/auth.php';
