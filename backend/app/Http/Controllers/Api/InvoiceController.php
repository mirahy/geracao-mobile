<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('faturas.ver'), 403);

        $unitId = $request->validate(['unit_id' => ['nullable', 'integer']])['unit_id'] ?? null;

        $invoices = Invoice::with('consumerUnit')
            ->when($unitId, fn ($q) => $q->where('consumer_unit_id', $unitId))
            ->orderByDesc('reference_month')
            ->limit(120)
            ->get()
            ->map(fn (Invoice $i) => [
                'id' => $i->id,
                'consumer_unit_id' => $i->consumer_unit_id,
                'unit_name' => $i->consumerUnit?->name,
                'reference_month' => $i->reference_month->format('Y-m-d'),
                'due_date' => $i->due_date?->format('Y-m-d'),
                'paid_at' => $i->paid_at?->format('Y-m-d'),
                'consumption_kwh' => $i->consumption_kwh,
                'injected_kwh' => $i->injected_kwh,
                'compensated_kwh' => $i->compensated_kwh,
                'credit_balance_kwh' => (float) $i->credit_balance_kwh,
                'total_amount' => $i->total_amount,
                'savings' => $i->savings,
            ]);

        return response()->json(['data' => $invoices]);
    }
}
