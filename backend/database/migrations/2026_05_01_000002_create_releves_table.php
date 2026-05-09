<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('releves', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('compteur_id')->constrained('compteurs')->cascadeOnDelete();
            $table->decimal('ancien_index', 12, 2);
            $table->decimal('nouvel_index', 12, 2);
            $table->decimal('consommation', 12, 2);
            $table->date('periode_debut');
            $table->date('periode_fin');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['compteur_id', 'periode_debut', 'periode_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('releves');
    }
};
