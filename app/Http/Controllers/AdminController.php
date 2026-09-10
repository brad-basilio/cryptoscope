<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Holding;
use App\Models\PortfolioTarget;
use App\Models\User;
use App\Services\CmcClient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function __construct(private CmcClient $cmc) {}

    public function index(): \Inertia\Response
    {
        $keyInfo = $this->cmc->keyInfo();
        $callLog = $this->cmc->getCallLog();

        // Estadísticas de Base de Datos
        $totalUsers      = User::count();
        $totalHoldings   = Holding::count();
        $totalAlerts     = Alert::count();
        $activeAlerts    = Alert::where('triggered', false)->count();
        $triggeredAlerts = Alert::where('triggered', true)->count();
        $totalTargets    = PortfolioTarget::count();

        // Lista de usuarios registrados para auditoría
        $users = User::select('id', 'name', 'email', 'role', 'created_at')
            ->withCount(['holdings', 'alerts'])
            ->latest()
            ->take(20)
            ->get();

        // Latencia promedio de las llamadas recientes
        $avgLatency = 0;
        if (!empty($callLog)) {
            $avgLatency = round(collect($callLog)->avg('elapsed_ms') ?? 0);
        }

        return Inertia::render('Admin/Dashboard', [
            'keyInfo' => $keyInfo,
            'callLog' => $callLog,
            'stats'   => [
                'total_users'      => $totalUsers,
                'total_holdings'   => $totalHoldings,
                'total_alerts'     => $totalAlerts,
                'active_alerts'    => $activeAlerts,
                'triggered_alerts' => $triggeredAlerts,
                'total_targets'    => $totalTargets,
                'avg_latency_ms'   => $avgLatency,
            ],
            'users'   => $users,
        ]);
    }

    public function purgeCache(): \Illuminate\Http\RedirectResponse
    {
        $this->cmc->clearCmcCache();
        return back()->with('success', 'Caché de CoinMarketCap purgada con éxito.');
    }

    public function toggleUserRole(User $user): \Illuminate\Http\RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'No puedes modificar tu propio rol.');
        }

        $newRole = $user->role === 'super_admin' ? 'user' : 'super_admin';
        $user->update(['role' => $newRole]);

        return back()->with('success', "Rol de {$user->name} actualizado a {$newRole}.");
    }
}
