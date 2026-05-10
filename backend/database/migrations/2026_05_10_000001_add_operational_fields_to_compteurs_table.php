<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('compteurs', function (Blueprint $table): void {
            if (! Schema::hasColumn('compteurs', 'num_contrat')) {
                $table->string('num_contrat')->nullable()->after('cadran');
            }

            if (! Schema::hasColumn('compteurs', 'num_tournee')) {
                $table->string('num_tournee')->nullable()->after('num_contrat');
            }

            if (! Schema::hasColumn('compteurs', 'usage')) {
                $table->string('usage')->nullable()->after('num_tournee');
            }
        });
    }

    public function down(): void
    {
        Schema::table('compteurs', function (Blueprint $table): void {
            foreach (['usage', 'num_tournee', 'num_contrat'] as $column) {
                if (Schema::hasColumn('compteurs', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
