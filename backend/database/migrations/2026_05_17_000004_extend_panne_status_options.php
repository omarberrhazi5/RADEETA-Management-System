<?php

use App\Enums\PanneStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasTable('pannes')
            && Schema::hasColumn('pannes', 'status')
            && DB::connection()->getDriverName() === 'mysql'
        ) {
            DB::statement("ALTER TABLE pannes MODIFY status ENUM('open','assigned','in_progress','resolved') NOT NULL DEFAULT 'open'");
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('pannes') || ! Schema::hasColumn('pannes', 'status')) {
            return;
        }

        DB::table('pannes')
            ->whereIn('status', [PanneStatus::Assigned->value, PanneStatus::InProgress->value])
            ->update(['status' => PanneStatus::Open->value]);

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE pannes MODIFY status ENUM('open','resolved') NOT NULL DEFAULT 'open'");
        }
    }
};
