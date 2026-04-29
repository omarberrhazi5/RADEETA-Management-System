<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('secteurs', function (Blueprint $table) {
            if (! Schema::hasColumn('secteurs', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('num_torne');
            }

            if (! Schema::hasColumn('secteurs', 'longitude')) {
                $table->decimal('longitude', 10, 8)->nullable()->after('latitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('secteurs', function (Blueprint $table) {
            if (Schema::hasColumn('secteurs', 'longitude')) {
                $table->dropColumn('longitude');
            }

            if (Schema::hasColumn('secteurs', 'latitude')) {
                $table->dropColumn('latitude');
            }
        });
    }
};
