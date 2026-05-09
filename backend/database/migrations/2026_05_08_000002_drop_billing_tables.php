<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('paiements');
        Schema::dropIfExists('factures');
        Schema::dropIfExists('tariff_settings');
    }

    public function down(): void
    {
        // Billing modules were removed from the application and are intentionally not restored.
    }
};
