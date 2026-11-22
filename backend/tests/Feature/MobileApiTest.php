<?php

namespace Tests\Feature;

use App\Models\ConsumerUnit;
use App\Models\SolarGeneration;
use App\Models\UnitAccess;
use App\Models\User;
use App\Services\Documents\DocumentImporter;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MobileApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $importer = app(DocumentImporter::class);
        foreach (['demonstrativo_2026_11.txt', 'fatura_geradora_2026_11.txt', 'fatura_recebedora_a_2026_11.txt'] as $f) {
            $importer->importText(file_get_contents(__DIR__.'/../Fixtures/'.$f));
        }
    }

    private function token(string $role, array $units = []): string
    {
        $user = User::factory()->create(['password' => Hash::make('segredo123')]);
        $user->assignRole($role);
        foreach ($units as $id => $edit) {
            UnitAccess::create(['user_id' => $user->id, 'consumer_unit_id' => $id, 'can_edit' => $edit]);
        }

        return $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'segredo123'])
            ->assertOk()->assertJsonStructure(['token', 'user' => ['permissions']])->json('token');
    }

    public function test_login_rejects_bad_password_and_requires_token(): void
    {
        $user = User::factory()->create(['password' => Hash::make('segredo123')]);
        $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => 'x'])->assertStatus(422);
        $this->getJson('/api/v1/dashboard')->assertUnauthorized();
    }

    public function test_dashboard_units_invoices_and_generation_flow(): void
    {
        $h = ['Authorization' => 'Bearer '.$this->token('Administrador')];
        $gen = ConsumerUnit::where('role', 'generator')->firstOrFail();

        $this->getJson('/api/v1/dashboard', $h)->assertOk()
            ->assertJsonStructure(['months', 'labels', 'totals' => ['generated', 'balance'], 'generation', 'consumption', 'cost' => ['with', 'without'], 'units' => [['unit' => ['id', 'formatted_uc']]]]);
        $this->getJson('/api/v1/months', $h)->assertOk()->assertJsonStructure(['data' => [['key', 'label']]]);
        $this->getJson('/api/v1/units', $h)->assertOk()->assertJsonCount(ConsumerUnit::count(), 'data');
        $this->getJson('/api/v1/invoices', $h)->assertOk()->assertJsonStructure(['data' => [['total_amount', 'savings']]]);

        $this->postJson('/api/v1/generations', ['consumer_unit_id' => $gen->id, 'reference_month' => '2026-11-01', 'generated_kwh' => 1234.5], $h)->assertCreated();
        $this->postJson('/api/v1/generations', ['consumer_unit_id' => $gen->id, 'reference_month' => '2026-11-01', 'generated_kwh' => 999], $h)->assertCreated();
        $this->assertSame(1, SolarGeneration::where('consumer_unit_id', $gen->id)->count());
        $this->getJson('/api/v1/generations', $h)->assertOk()->assertJsonPath('data.0.generated_kwh', 999);
    }

    public function test_consulta_scoped_to_unit_cannot_write_generation(): void
    {
        $receiver = ConsumerUnit::where('role', 'receiver')->whereHas('invoices')->firstOrFail();
        $gen = ConsumerUnit::where('role', 'generator')->firstOrFail();
        $h = ['Authorization' => 'Bearer '.$this->token('Consulta', [$receiver->id => false])];

        $this->getJson('/api/v1/units', $h)->assertOk()->assertJsonCount(1, 'data');
        $this->postJson('/api/v1/generations', ['consumer_unit_id' => $gen->id, 'reference_month' => '2026-11-01', 'generated_kwh' => 1], $h)->assertForbidden();
    }
}
