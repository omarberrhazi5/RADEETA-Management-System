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
        Schema::create('compteurs', function (Blueprint $table) {
            $table->id();
            $table->string('cadran')->unique();
            $table->enum('calibre', ['15', '20']);
            $table->string('marque')->nullable();
            $table->enum('service_type', ['water', 'electricity'])->default('water');
            $table->decimal('index_releve', 10, 2)->default(0);
            $table->foreignId('id_client')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('id_secteur')->constrained('secteurs')->restrictOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compteurs');
    }
};
