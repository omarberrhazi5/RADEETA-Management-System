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

        if (Schema::hasColumn('interventions', 'id_panne') && ! Schema::hasColumn('interventions', 'panne_id')) {
            Schema::table('interventions', function (Blueprint $table): void {
                $table->foreignId('panne_id')->nullable()->after('id_panne')->constrained('pannes')->cascadeOnDelete();
            });

            DB::table('interventions')->whereNull('panne_id')->update([
                'panne_id' => DB::raw('id_panne'),
            ]);
        }

        Schema::table('interventions', function (Blueprint $table): void {
            if (Schema::hasColumn('interventions', 'numero_intervention') && ! Schema::hasColumn('interventions', 'intervention_number')) {
                $table->renameColumn('numero_intervention', 'intervention_number');
            }

            if (! Schema::hasColumn('interventions', 'service_type')) {
                $table->enum('service_type', ['water', 'electricity'])->default('water')->after('technician_id');
            }

            if (! Schema::hasColumn('interventions', 'priority')) {
                $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal')->after('observations');
            }

            if (Schema::hasColumn('interventions', 'intervention_at') && ! Schema::hasColumn('interventions', 'started_at')) {
                $table->renameColumn('intervention_at', 'started_at');
            }

            if (Schema::hasColumn('interventions', 'material_used') && ! Schema::hasColumn('interventions', 'materials_used')) {
                $table->renameColumn('material_used', 'materials_used');
            }

            if (! Schema::hasColumn('interventions', 'completed_at')) {
                $table->dateTime('completed_at')->nullable()->after('started_at');
            }

            if (! Schema::hasColumn('interventions', 'client_id')) {
                $table->foreignId('client_id')->nullable()->after('panne_id')->constrained('clients')->nullOnDelete();
            }

            if (! Schema::hasColumn('interventions', 'meter_id')) {
                $table->foreignId('meter_id')->nullable()->after('client_id')->constrained('compteurs')->nullOnDelete();
            }
        });

        DB::table('interventions')->where('status', 'echouee')->update(['status' => 'annulee']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('interventions')) {
            return;
        }

        Schema::table('interventions', function (Blueprint $table): void {
            if (Schema::hasColumn('interventions', 'priority')) {
                $table->dropColumn('priority');
            }

            if (Schema::hasColumn('interventions', 'service_type')) {
                $table->dropColumn('service_type');
            }
        });
    }
};
