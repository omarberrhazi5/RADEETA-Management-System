<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pannes', function (Blueprint $table): void {
            if (! Schema::hasColumn('pannes', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('assigned_to')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('secteurs', function (Blueprint $table): void {
            if ($this->hasIndex('secteurs', 'secteurs_num_torne_unique')) {
                $table->dropUnique('secteurs_num_torne_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('secteurs', function (Blueprint $table): void {
            if (Schema::hasColumn('secteurs', 'num_torne') && ! $this->hasIndex('secteurs', 'secteurs_num_torne_unique')) {
                $table->unique('num_torne', 'secteurs_num_torne_unique');
            }
        });

        Schema::table('pannes', function (Blueprint $table): void {
            if (Schema::hasColumn('pannes', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $existing): bool => $existing['name'] === $index);
    }
};
