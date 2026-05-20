<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const NEW_VALUES = ['Domestique', 'Patente', 'Administration'];

    private const LEGACY_TO_NEW = [
        'domestic' => 'Domestique',
        'commercial' => 'Patente',
        'industrial' => 'Administration',
    ];

    private const NEW_TO_LEGACY = [
        'Domestique' => 'domestic',
        'Patente' => 'commercial',
        'Administration' => 'industrial',
    ];

    public function up(): void
    {
        if (Schema::hasTable('clients') && Schema::hasColumn('clients', 'type_abonnement')) {
            $this->alterClientSubscriptionEnum(['domestic', 'commercial', 'industrial', ...self::NEW_VALUES], 'domestic');
            $this->mapValues('clients', 'type_abonnement', self::LEGACY_TO_NEW);
            $this->alterClientSubscriptionEnum(self::NEW_VALUES, 'Domestique');
        }

        if (Schema::hasTable('compteurs') && Schema::hasColumn('compteurs', 'usage')) {
            $this->mapValues('compteurs', 'usage', self::LEGACY_TO_NEW);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('clients') && Schema::hasColumn('clients', 'type_abonnement')) {
            $this->alterClientSubscriptionEnum([...self::NEW_VALUES, 'domestic', 'commercial', 'industrial'], 'Domestique');
            $this->mapValues('clients', 'type_abonnement', self::NEW_TO_LEGACY);
            $this->alterClientSubscriptionEnum(['domestic', 'commercial', 'industrial'], 'domestic');
        }

        if (Schema::hasTable('compteurs') && Schema::hasColumn('compteurs', 'usage')) {
            $this->mapValues('compteurs', 'usage', self::NEW_TO_LEGACY);
        }
    }

    private function mapValues(string $table, string $column, array $values): void
    {
        foreach ($values as $from => $to) {
            DB::table($table)->where($column, $from)->update([$column => $to]);
        }
    }

    private function alterClientSubscriptionEnum(array $values, string $default): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        $allowed = collect($values)
            ->map(fn (string $value): string => "'".str_replace("'", "''", $value)."'")
            ->implode(',');

        DB::statement("ALTER TABLE clients MODIFY type_abonnement ENUM({$allowed}) NOT NULL DEFAULT '{$default}'");
    }
};
