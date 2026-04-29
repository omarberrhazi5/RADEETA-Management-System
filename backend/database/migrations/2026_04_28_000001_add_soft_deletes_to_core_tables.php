<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('compteurs', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('secteurs', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('compteurs', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('secteurs', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
