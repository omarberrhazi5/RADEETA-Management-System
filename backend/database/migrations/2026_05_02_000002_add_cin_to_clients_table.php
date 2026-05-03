<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('clients') && ! Schema::hasColumn('clients', 'cin')) {
            Schema::table('clients', function (Blueprint $table): void {
                $table->string('cin', 20)->nullable()->after('prenom')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('clients') && Schema::hasColumn('clients', 'cin')) {
            Schema::table('clients', function (Blueprint $table): void {
                $table->dropColumn('cin');
            });
        }
    }
};
