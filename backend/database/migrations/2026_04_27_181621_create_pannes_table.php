<?php

use App\Enums\PanneAnomalie;
use App\Enums\PanneStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pannes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_compteur')->constrained('compteurs')->cascadeOnDelete();
            $table->date('date_panne');
            $table->enum('anomalie', PanneAnomalie::values());
            $table->text('description')->nullable();
            $table->enum('status', PanneStatus::values())->default(PanneStatus::Open->value);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pannes');
    }
};
