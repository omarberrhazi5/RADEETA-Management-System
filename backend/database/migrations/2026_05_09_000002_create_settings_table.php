<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('settings')->insert([
            ['key' => 'agency_name', 'value' => json_encode('SRM-FM Taza'), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'application_name', 'value' => json_encode('SRM-FM'), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'default_language', 'value' => json_encode('fr'), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'notification_preferences', 'value' => json_encode(['email' => true, 'in_app' => true, 'daily_digest' => false]), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'dashboard_preferences', 'value' => json_encode(['show_maps' => true, 'show_charts' => true, 'compact_cards' => false]), 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
