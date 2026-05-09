<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('interventions')) {
            return;
        }

        Schema::table('interventions', function (Blueprint $table): void {
            if (Schema::hasColumn('interventions', 'numero_intervention') && ! Schema::hasColumn('interventions', 'intervention_number')) {
                $table->renameColumn('numero_intervention', 'intervention_number');
            }

            if (Schema::hasColumn('interventions', 'intervention_at') && ! Schema::hasColumn('interventions', 'started_at')) {
                $table->renameColumn('intervention_at', 'started_at');
            }

            if (Schema::hasColumn('interventions', 'material_used') && ! Schema::hasColumn('interventions', 'materials_used')) {
                $table->renameColumn('material_used', 'materials_used');
            }
        });

        Schema::table('interventions', function (Blueprint $table): void {
            if (! Schema::hasColumn('interventions', 'client_id')) {
                $table->foreignId('client_id')->nullable()->after('panne_id')->constrained('clients')->nullOnDelete();
            }

            if (! Schema::hasColumn('interventions', 'meter_id')) {
                $table->foreignId('meter_id')->nullable()->after('client_id')->constrained('compteurs')->nullOnDelete();
            }

            if (! Schema::hasColumn('interventions', 'completed_at')) {
                $table->dateTime('completed_at')->nullable()->after('started_at');
            }
        });

        DB::table('interventions')
            ->whereNull('client_id')
            ->orWhereNull('meter_id')
            ->orderBy('id')
            ->get(['id', 'panne_id'])
            ->each(function (object $intervention): void {
                $panne = DB::table('pannes')
                    ->leftJoin('compteurs', 'pannes.id_compteur', '=', 'compteurs.id')
                    ->where('pannes.id', $intervention->panne_id)
                    ->first(['compteurs.id as meter_id', 'compteurs.id_client as client_id']);

                if ($panne) {
                    DB::table('interventions')
                        ->where('id', $intervention->id)
                        ->update([
                            'client_id' => $panne->client_id,
                            'meter_id' => $panne->meter_id,
                        ]);
                }
            });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE interventions MODIFY status ENUM('en_attente', 'en_cours', 'terminee', 'annulee', 'echouee') NOT NULL DEFAULT 'en_attente'");
            DB::table('interventions')->where('status', 'echouee')->update(['status' => 'annulee']);
            DB::statement("ALTER TABLE interventions MODIFY status ENUM('en_attente', 'en_cours', 'terminee', 'annulee') NOT NULL DEFAULT 'en_attente'");
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('interventions')) {
            return;
        }

        Schema::table('interventions', function (Blueprint $table): void {
            if (Schema::hasColumn('interventions', 'completed_at')) {
                $table->dropColumn('completed_at');
            }

            if (Schema::hasColumn('interventions', 'meter_id')) {
                $table->dropConstrainedForeignId('meter_id');
            }

            if (Schema::hasColumn('interventions', 'client_id')) {
                $table->dropConstrainedForeignId('client_id');
            }
        });
    }
};
