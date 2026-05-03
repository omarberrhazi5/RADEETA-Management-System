<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE users MODIFY role VARCHAR(50) NOT NULL DEFAULT 'viewer'");
            }

            DB::table('users')->where('role', 'plombier')->update(['role' => 'operator']);
            DB::table('users')->where('role', 'technician')->update(['role' => 'operator']);
            DB::table('users')->where('role', 'responsable')->update(['role' => 'manager']);
            DB::table('users')
                ->whereNotIn('role', ['super_admin', 'admin', 'manager', 'operator', 'viewer', 'developer'])
                ->update(['role' => 'viewer']);
        }

        if (Schema::hasTable('pannes') && ! Schema::hasColumn('pannes', 'assigned_to')) {
            Schema::table('pannes', function (Blueprint $table): void {
                $table->foreignId('assigned_to')
                    ->nullable()
                    ->after('status')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pannes') && Schema::hasColumn('pannes', 'assigned_to')) {
            Schema::table('pannes', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('assigned_to');
            });
        }
    }
};
