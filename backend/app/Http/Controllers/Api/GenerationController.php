<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsumerUnit;
use App\Models\SolarGeneration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GenerationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('geracao.ver'), 403);

        $unitId = $request->validate(['unit_id' => ['nullable', 'integer']])['unit_id'] ?? null;

        $rows = SolarGeneration::with('consumerUnit')
            ->when($unitId, fn ($q) => $q->where('consumer_unit_id', $unitId))
            ->orderByDesc('reference_month')
            ->limit(120)
            ->get()
            ->map(fn (SolarGeneration $g) => $this->present($g))
            ->values();

        return response()->json(['data' => $rows]);
    }

    /** Informa (ou atualiza) a geração total do mês de uma UC geradora. */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->can('geracao.editar'), 403);

        $data = $request->validate([
            'consumer_unit_id' => ['required', 'integer', 'exists:consumer_units,id'],
            'reference_month' => ['required', 'date_format:Y-m-d'],
            'generated_kwh' => ['required', 'numeric', 'min:0'],
        ]);

        abort_unless($user->canEditUnit((int) $data['consumer_unit_id']), 403);
        abort_unless(ConsumerUnit::findOrFail($data['consumer_unit_id'])->isGenerator(), 422, 'A UC informada não é geradora.');

        $month = substr($data['reference_month'], 0, 7).'-01';

        $generation = SolarGeneration::updateOrCreate(
            ['consumer_unit_id' => $data['consumer_unit_id'], 'reference_month' => $month],
            ['generated_kwh' => $data['generated_kwh'], 'source' => 'manual'],
        );

        return response()->json(['data' => $this->present($generation->load('consumerUnit'))], 201);
    }

    /** @return array<string, mixed> */
    private function present(SolarGeneration $g): array
    {
        return [
            'id' => $g->id,
            'consumer_unit_id' => $g->consumer_unit_id,
            'unit_name' => $g->consumerUnit?->name,
            'reference_month' => $g->reference_month->format('Y-m-d'),
            'generated_kwh' => $g->generated_kwh,
            'source' => $g->source === 'manual' ? 'manual' : 'planilha',
        ];
    }
}
