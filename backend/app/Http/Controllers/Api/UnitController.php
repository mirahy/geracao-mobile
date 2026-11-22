<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsumerUnit;
use Illuminate\Http\JsonResponse;

class UnitController extends Controller
{
    public function index(): JsonResponse
    {
        abort_unless(auth()->user()->can('unidades.ver'), 403);

        return response()->json([
            'data' => ConsumerUnit::orderBy('name')->get()->map(fn (ConsumerUnit $u) => self::present($u))->values(),
        ]);
    }

    /** @return array<string, mixed> */
    public static function present(ConsumerUnit $unit): array
    {
        return [
            'id' => $unit->id,
            'name' => $unit->name,
            'uc_number' => $unit->uc_number,
            'formatted_uc' => $unit->formatted_uc,
            'role' => $unit->role,
            'city' => $unit->city,
            'active' => $unit->active,
        ];
    }
}
