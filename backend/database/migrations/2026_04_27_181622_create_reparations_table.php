<?php

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
        Schema::create('reparations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_panne')->constrained('pannes')->cascadeOnDelete();
            $table->unsignedBigInteger('id_plombier')->nullable();
            $table->date('date_reparation');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('id_plombier', 'reparations_id_plombier_users_foreign')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reparations');
    }
};
