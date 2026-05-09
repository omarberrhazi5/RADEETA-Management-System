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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('police')->unique();
            $table->string('nom');
            $table->string('prenom')->nullable();
            $table->string('cin', 20)->nullable()->index();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->enum('type_abonnement', ['domestic', 'commercial', 'industrial'])->default('domestic');
            $table->enum('service_type', ['water', 'electricity'])->default('water');
            $table->foreignId('id_secteur')->nullable()->constrained('secteurs')->nullOnDelete();
            $table->boolean('abonne')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
