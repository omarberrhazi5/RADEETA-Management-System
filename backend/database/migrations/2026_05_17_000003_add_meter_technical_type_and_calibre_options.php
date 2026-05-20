<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('compteurs')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'mysql' && Schema::hasColumn('compteurs', 'calibre')) {
            DB::statement('ALTER TABLE compteurs MODIFY calibre VARCHAR(255) NOT NULL');
        }

        if (! Schema::hasColumn('compteurs', 'technical_type')) {
            Schema::table('compteurs', function (Blueprint $table): void {
                $table->string('technical_type')->nullable()->after('calibre');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('compteurs')) {
            return;
        }

        if (Schema::hasColumn('compteurs', 'technical_type')) {
            Schema::table('compteurs', function (Blueprint $table): void {
                $table->dropColumn('technical_type');
            });
        }

        if (DB::connection()->getDriverName() === 'mysql' && Schema::hasColumn('compteurs', 'calibre')) {
            DB::statement("ALTER TABLE compteurs MODIFY calibre ENUM('15','20') NOT NULL");
        }
    }
};
