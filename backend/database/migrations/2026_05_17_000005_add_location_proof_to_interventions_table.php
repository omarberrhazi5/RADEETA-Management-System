<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('interventions')) {
            return;
        }

        Schema::table('interventions', function (Blueprint $table): void {
            if (! Schema::hasColumn('interventions', 'latitude')) {
                $table->string('latitude')->nullable()->after('observations');
            }

            if (! Schema::hasColumn('interventions', 'longitude')) {
                $table->string('longitude')->nullable()->after('latitude');
            }

            if (! Schema::hasColumn('interventions', 'location_note')) {
                $table->text('location_note')->nullable()->after('longitude');
            }
        });

        if (! Schema::hasTable('reparations')) {
            return;
        }

        Schema::table('reparations', function (Blueprint $table): void {
            if (! Schema::hasColumn('reparations', 'latitude')) {
                $table->string('latitude')->nullable()->after('description');
            }

            if (! Schema::hasColumn('reparations', 'longitude')) {
                $table->string('longitude')->nullable()->after('latitude');
            }

            if (! Schema::hasColumn('reparations', 'location_note')) {
                $table->text('location_note')->nullable()->after('longitude');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('interventions')) {
            return;
        }

        Schema::table('interventions', function (Blueprint $table): void {
            foreach (['location_note', 'longitude', 'latitude'] as $column) {
                if (Schema::hasColumn('interventions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        if (! Schema::hasTable('reparations')) {
            return;
        }

        Schema::table('reparations', function (Blueprint $table): void {
            foreach (['location_note', 'longitude', 'latitude'] as $column) {
                if (Schema::hasColumn('reparations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
