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
            DB::table('users')->whereIn('role', ['operator', 'plombier'])->update(['role' => 'technician']);
        }

        if (Schema::hasTable('clients') && ! Schema::hasColumn('clients', 'service_type')) {
            Schema::table('clients', function (Blueprint $table): void {
                $table->enum('service_type', ['water', 'electricity'])->default('water')->after('type_abonnement');
            });
        }

        if (Schema::hasTable('compteurs') && ! Schema::hasColumn('compteurs', 'service_type')) {
            Schema::table('compteurs', function (Blueprint $table): void {
                $table->enum('service_type', ['water', 'electricity'])->default('water')->after('marque');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('compteurs') && Schema::hasColumn('compteurs', 'service_type')) {
            Schema::table('compteurs', fn (Blueprint $table) => $table->dropColumn('service_type'));
        }

        if (Schema::hasTable('clients') && Schema::hasColumn('clients', 'service_type')) {
            Schema::table('clients', fn (Blueprint $table) => $table->dropColumn('service_type'));
        }
    }
};
