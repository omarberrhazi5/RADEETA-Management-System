<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('interventions') || ! Schema::hasColumn('interventions', 'technician_id')) {
            return;
        }

        Schema::table('interventions', function (Blueprint $table): void {
            $table->foreignId('technician_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Keep nullable to avoid breaking existing pool tickets on rollback.
    }
};
