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

        Schema::create('factures', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('compteur_id')->constrained('compteurs')->cascadeOnDelete();
            $table->foreignId('releve_id')->constrained('releves')->cascadeOnDelete();
            $table->string('reference')->unique();
            $table->decimal('montant_ht', 12, 2);
            $table->decimal('taxes', 12, 2)->default(0);
            $table->decimal('tva', 12, 2)->default(0);
            $table->decimal('total_ttc', 12, 2);
            $table->enum('statut', ['payee', 'impayee', 'partielle'])->default('impayee');
            $table->date('due_date');
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->index(['client_id', 'statut']);
            $table->index(['compteur_id', 'generated_at']);
        });

        Schema::create('paiements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->decimal('montant', 12, 2);
            $table->string('mode')->default('cash');
            $table->string('reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['facture_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
        Schema::dropIfExists('factures');
        Schema::dropIfExists('releves');
    }
};
