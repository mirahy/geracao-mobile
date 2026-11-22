<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\UnitController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::get('months', [DashboardController::class, 'months']);
        Route::get('dashboard', [DashboardController::class, 'show']);
        Route::get('units', [UnitController::class, 'index']);
        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::get('generations', [GenerationController::class, 'index']);
        Route::post('generations', [GenerationController::class, 'store']);
    });
});
