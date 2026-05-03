<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tariff_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });

        Schema::table('factures', function (Blueprint $table): void {
            $table->string('tournee')->nullable()->after('reference');
            $table->string('numero_client')->nullable()->after('tournee');
            $table->string('client_name')->nullable()->after('numero_client');
            $table->string('address')->nullable()->after('client_name');
            $table->string('numero_contrat')->nullable()->after('address');
            $table->string('usage_type')->nullable()->after('numero_contrat');
            $table->string('agence')->default('SRM Taza')->after('usage_type');
            $table->date('facture_date')->nullable()->after('agence');
            $table->date('periode_debut')->nullable()->after('facture_date');
            $table->date('periode_fin')->nullable()->after('periode_debut');
            $table->string('numero_facture_eau_assainissement')->nullable()->after('periode_fin');
            $table->string('compteur_number')->nullable()->after('numero_facture_eau_assainissement');
            $table->decimal('coefficient', 8, 2)->default(1)->after('compteur_number');
            $table->string('diametre_compteur')->nullable()->after('coefficient');
            $table->date('ancienne_date_lecture')->nullable()->after('diametre_compteur');
            $table->date('nouvelle_date_lecture')->nullable()->after('ancienne_date_lecture');
            $table->decimal('ancien_index', 12, 2)->nullable()->after('nouvelle_date_lecture');
            $table->decimal('nouvel_index', 12, 2)->nullable()->after('ancien_index');
            $table->decimal('consommation_m3', 12, 2)->nullable()->after('nouvel_index');
            $table->decimal('montant_especes', 12, 2)->nullable()->after('total_ttc');
            $table->decimal('montant_autre_mode', 12, 2)->nullable()->after('montant_especes');
            $table->json('line_items')->nullable()->after('montant_autre_mode');
            $table->json('detail_snapshot')->nullable()->after('line_items');
        });
    }

    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table): void {
            $table->dropColumn([
                'tournee',
                'numero_client',
                'client_name',
                'address',
                'numero_contrat',
                'usage_type',
                'agence',
                'facture_date',
                'periode_debut',
                'periode_fin',
                'numero_facture_eau_assainissement',
                'compteur_number',
                'coefficient',
                'diametre_compteur',
                'ancienne_date_lecture',
                'nouvelle_date_lecture',
                'ancien_index',
                'nouvel_index',
                'consommation_m3',
                'montant_especes',
                'montant_autre_mode',
                'line_items',
                'detail_snapshot',
            ]);
        });

        Schema::dropIfExists('tariff_settings');
    }
};
