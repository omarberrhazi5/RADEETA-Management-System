<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('secteurs')->exists()) {
            return;
        }

        DB::table('secteurs')->insert([
            [
                'nom_secteur' => 'Qods 1',
                'emplacement' => 'Taza Haut',
                'num_torne' => 'T-001',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nom_secteur' => 'Medina',
                'emplacement' => 'Taza Haut',
                'num_torne' => 'T-002',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nom_secteur' => 'Taza Bas',
                'emplacement' => 'Taza Bas',
                'num_torne' => 'T-003',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('secteurs')
            ->whereIn('num_torne', ['T-001', 'T-002', 'T-003'])
            ->delete();
    }
};
