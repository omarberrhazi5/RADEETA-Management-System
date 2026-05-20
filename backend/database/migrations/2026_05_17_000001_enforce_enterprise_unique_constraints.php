<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->deduplicateClientCin();
        $this->deduplicateSectorCodes();

        Schema::table('clients', function (Blueprint $table): void {
            if (Schema::hasColumn('clients', 'cin') && ! $this->hasIndex('clients', 'clients_cin_unique')) {
                $table->unique('cin', 'clients_cin_unique');
            }
        });

        Schema::table('secteurs', function (Blueprint $table): void {
            if (Schema::hasColumn('secteurs', 'num_torne') && ! $this->hasIndex('secteurs', 'secteurs_num_torne_unique')) {
                $table->unique('num_torne', 'secteurs_num_torne_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('secteurs', function (Blueprint $table): void {
            if ($this->hasIndex('secteurs', 'secteurs_num_torne_unique')) {
                $table->dropUnique('secteurs_num_torne_unique');
            }
        });

        Schema::table('clients', function (Blueprint $table): void {
            if ($this->hasIndex('clients', 'clients_cin_unique')) {
                $table->dropUnique('clients_cin_unique');
            }
        });
    }

    private function deduplicateClientCin(): void
    {
        if (! Schema::hasColumn('clients', 'cin')) {
            return;
        }

        DB::table('clients')
            ->select('cin')
            ->whereNotNull('cin')
            ->where('cin', '!=', '')
            ->groupBy('cin')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('cin')
            ->each(function (string $cin): void {
                DB::table('clients')
                    ->where('cin', $cin)
                    ->orderBy('id')
                    ->pluck('id')
                    ->skip(1)
                    ->each(fn (int $id) => DB::table('clients')->where('id', $id)->update(['cin' => null]));
            });
    }

    private function deduplicateSectorCodes(): void
    {
        if (! Schema::hasColumn('secteurs', 'num_torne')) {
            return;
        }

        DB::table('secteurs')
            ->select('num_torne')
            ->whereNotNull('num_torne')
            ->where('num_torne', '!=', '')
            ->groupBy('num_torne')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('num_torne')
            ->each(function (string $code): void {
                DB::table('secteurs')
                    ->where('num_torne', $code)
                    ->orderBy('id')
                    ->pluck('id')
                    ->skip(1)
                    ->each(function (int $sector) use ($code): void {
                        DB::table('secteurs')
                            ->where('id', $sector)
                            ->update(['num_torne' => $code.'-'.$sector]);
                    });
            });
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $existing): bool => $existing['name'] === $index);
    }
};
