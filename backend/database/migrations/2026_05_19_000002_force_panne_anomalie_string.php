<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pannes') || ! Schema::hasColumn('pannes', 'anomalie')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE pannes MODIFY anomalie VARCHAR(255) NULL');

            return;
        }

        Schema::table('pannes', function (Blueprint $table): void {
            $table->string('anomalie', 255)->nullable()->change();
        });
    }

    public function down(): void
    {
        // Keep custom anomaly text valid after rollback.
    }
};
