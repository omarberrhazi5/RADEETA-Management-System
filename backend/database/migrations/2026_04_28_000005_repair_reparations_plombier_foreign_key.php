<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        $foreignKeys = collect(DB::select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'reparations'
              AND COLUMN_NAME = 'id_plombier'
              AND REFERENCED_TABLE_NAME IS NOT NULL
        "));

        foreach ($foreignKeys as $foreignKey) {
            DB::statement("ALTER TABLE reparations DROP FOREIGN KEY {$foreignKey->CONSTRAINT_NAME}");
        }

        DB::table('reparations')
            ->whereNotNull('id_plombier')
            ->whereNotIn('id_plombier', DB::table('users')->select('id'))
            ->update(['id_plombier' => null]);

        Schema::table('reparations', function (Blueprint $table): void {
            $table->foreign('id_plombier', 'reparations_id_plombier_users_foreign')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE reparations DROP FOREIGN KEY reparations_id_plombier_users_foreign');
    }
};
