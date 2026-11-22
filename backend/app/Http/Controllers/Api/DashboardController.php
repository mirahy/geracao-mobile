<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\EnergyDashboard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function months(): JsonResponse
    {
        abort_unless(auth()->user()->can('painel.ver'), 403);

        $data = collect(EnergyDashboard::availableMonths())
            ->map(fn (string $label, string $key) => ['key' => $key, 'label' => $label])
            ->values();

        return response()->json(['data' => $data]);
    }

    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('painel.ver'), 403);

        $filters = $request->validate([
            'unit_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date_format:Y-m'],
            'to' => ['nullable', 'date_format:Y-m'],
        ]);

        // O escopo global AccessibleUnitsScope já limita os dados às UCs do usuário.
        $dashboard = EnergyDashboard::make($filters['unit_id'] ?? null, $filters['from'] ?? null, $filters['to'] ?? null);

        return response()->json([
            'months' => $dashboard->months(),
            'labels' => $dashboard->labels(),
            'totals' => $dashboard->totals(),
            'generation' => $dashboard->generationSeries(),
            'consumption' => $dashboard->consumptionSeries(),
            'cost' => $dashboard->savingsSeries(),
            'units' => $dashboard->unitsSummary()->map(fn (array $row) => [
                ...$row,
                'unit' => UnitController::present($row['unit']),
            ])->values(),
        ]);
    }
}
