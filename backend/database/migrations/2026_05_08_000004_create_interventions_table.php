<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interventions', function (Blueprint $table): void {
            $table->id();
            $table->string('intervention_number')->unique();
            $table->foreignId('panne_id')->nullable()->constrained('pannes')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('meter_id')->nullable()->constrained('compteurs')->nullOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('service_type', ['water', 'electricity'])->default('water');
            $table->string('work_type');
            $table->json('materials_used')->nullable();
            $table->text('observations')->nullable();
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', ['en_attente', 'en_cours', 'terminee', 'annulee'])->default('en_attente');
            $table->dateTime('started_at');
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['panne_id', 'status']);
            $table->index(['service_type', 'status']);
            $table->index(['technician_id', 'started_at']);
            $table->index(['client_id', 'meter_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};
