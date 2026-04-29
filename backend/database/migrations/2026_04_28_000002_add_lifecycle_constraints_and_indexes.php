<?php

use App\Enums\PanneStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->normalizeLegacyColumns();

        Schema::table('pannes', function (Blueprint $table) {
            if (! Schema::hasColumn('pannes', 'status')) {
                $table->string('status')->default(PanneStatus::Open->value)->after('anomalie');
            }

            if (! Schema::hasColumn('pannes', 'deleted_at')) {
                $table->softDeletes();
            }

            if (! $this->hasIndex('pannes', 'pannes_status_index')) {
                $table->index('status', 'pannes_status_index');
            }

            if (! $this->hasIndex('pannes', 'pannes_date_panne_index')) {
                $table->index('date_panne', 'pannes_date_panne_index');
            }

            if (! $this->hasIndex('pannes', 'pannes_status_date_panne_index')) {
                $table->index(['status', 'date_panne'], 'pannes_status_date_panne_index');
            }
        });

        $this->normalizePanneStatusValues();

        Schema::table('reparations', function (Blueprint $table) {
            if (! Schema::hasColumn('reparations', 'deleted_at')) {
                $table->softDeletes();
            }

            if (! $this->hasIndex('reparations', 'reparations_id_panne_index')) {
                $table->index('id_panne', 'reparations_id_panne_index');
            }

            if (! $this->hasIndex('reparations', 'reparations_date_reparation_index')) {
                $table->index('date_reparation', 'reparations_date_reparation_index');
            }
        });

        Schema::table('compteurs', function (Blueprint $table) {
            if (! $this->hasIndex('compteurs', 'compteurs_id_secteur_index')) {
                $table->index('id_secteur', 'compteurs_id_secteur_index');
            }

            if (! $this->hasIndex('compteurs', 'compteurs_id_secteur_id_client_index')) {
                $table->index(['id_secteur', 'id_client'], 'compteurs_id_secteur_id_client_index');
            }
        });

        Schema::table('secteurs', function (Blueprint $table) {
            if (! Schema::hasColumn('secteurs', 'num_torne')) {
                $table->string('num_torne')->nullable()->after('emplacement');
            }

            if (! $this->hasIndex('secteurs', 'secteurs_identity_unique')) {
                $table->unique(['nom_secteur', 'emplacement', 'num_torne'], 'secteurs_identity_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('secteurs', function (Blueprint $table) {
            if ($this->hasIndex('secteurs', 'secteurs_identity_unique')) {
                $table->dropUnique('secteurs_identity_unique');
            }
        });

        Schema::table('compteurs', function (Blueprint $table) {
            if ($this->hasIndex('compteurs', 'compteurs_id_secteur_id_client_index')) {
                $table->dropIndex('compteurs_id_secteur_id_client_index');
            }

            if ($this->hasIndex('compteurs', 'compteurs_id_secteur_index')) {
                $table->dropIndex('compteurs_id_secteur_index');
            }
        });

        Schema::table('reparations', function (Blueprint $table) {
            if ($this->hasIndex('reparations', 'reparations_date_reparation_index')) {
                $table->dropIndex('reparations_date_reparation_index');
            }

            if ($this->hasIndex('reparations', 'reparations_id_panne_index')) {
                $table->dropIndex('reparations_id_panne_index');
            }

            if (Schema::hasColumn('reparations', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        Schema::table('pannes', function (Blueprint $table) {
            if ($this->hasIndex('pannes', 'pannes_status_date_panne_index')) {
                $table->dropIndex('pannes_status_date_panne_index');
            }

            if ($this->hasIndex('pannes', 'pannes_date_panne_index')) {
                $table->dropIndex('pannes_date_panne_index');
            }

            if ($this->hasIndex('pannes', 'pannes_status_index')) {
                $table->dropIndex('pannes_status_index');
            }

            if (Schema::hasColumn('pannes', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }

    private function normalizeLegacyColumns(): void
    {
        $renames = [
            'compteurs' => [
                'client_id' => 'id_client',
                'secteur_id' => 'id_secteur',
            ],
            'pannes' => [
                'compteur_id' => 'id_compteur',
            ],
            'reparations' => [
                'panne_id' => 'id_panne',
                'plombier_id' => 'id_plombier',
            ],
        ];

        foreach ($renames as $table => $columns) {
            foreach ($columns as $from => $to) {
                if (Schema::hasColumn($table, $from) && ! Schema::hasColumn($table, $to)) {
                    Schema::table($table, function (Blueprint $table) use ($from, $to): void {
                        $table->renameColumn($from, $to);
                    });
                }
            }
        }
    }

    private function normalizePanneStatusValues(): void
    {
        if (! Schema::hasColumn('pannes', 'status')) {
            return;
        }

        if (Schema::hasColumn('pannes', 'statut')) {
            DB::table('pannes')
                ->where('statut', 'resolue')
                ->update(['status' => PanneStatus::Resolved->value]);

            DB::table('pannes')
                ->whereIn('statut', ['ouverte', 'en_cours'])
                ->update(['status' => PanneStatus::Open->value]);
        }

        DB::table('pannes')
            ->whereNotIn('status', PanneStatus::values())
            ->orWhereNull('status')
            ->update(['status' => PanneStatus::Open->value]);
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $existing): bool => $existing['name'] === $index);
    }
};
