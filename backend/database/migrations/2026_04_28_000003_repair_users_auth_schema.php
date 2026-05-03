<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'nom')) {
                $table->string('nom')->nullable()->after('id');
            }

            if (! Schema::hasColumn('users', 'prenom')) {
                $table->string('prenom')->nullable()->after('nom');
            }

            if (! Schema::hasColumn('users', 'identifiant')) {
                $table->string('identifiant')->nullable()->after('prenom');
            }
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role VARCHAR(50) NOT NULL DEFAULT 'viewer'");
        }

        DB::table('users')->where('role', 'plombier')->update(['role' => 'operator']);
        DB::table('users')->where('role', 'technician')->update(['role' => 'operator']);
        DB::table('users')->where('role', 'responsable')->update(['role' => 'manager']);
        DB::table('users')
            ->whereNotIn('role', ['super_admin', 'admin', 'manager', 'operator', 'viewer', 'developer'])
            ->update(['role' => 'viewer']);

        DB::table('users')->orderBy('id')->each(function (object $user): void {
            $fallbackName = $user->name ?: 'User '.$user->id;
            $baseIdentifier = $user->email
                ? str($user->email)->before('@')->slug('_')->toString()
                : str($fallbackName)->slug('_')->toString();

            $identifier = $user->identifiant ?: ($baseIdentifier ?: 'user_'.$user->id);

            if (DB::table('users')->where('identifiant', $identifier)->where('id', '!=', $user->id)->exists()) {
                $identifier .= '_'.$user->id;
            }

            DB::table('users')->where('id', $user->id)->update([
                'nom' => $user->nom ?: $fallbackName,
                'identifiant' => $identifier,
            ]);
        });

        if (DB::table('users')->count() === 0) {
            DB::table('users')->insert([
                'nom' => 'Admin',
                'prenom' => 'Default',
                'identifiant' => 'admin',
                'name' => 'Default Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (! $this->hasIndex('users', 'users_identifiant_unique')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->unique('identifiant', 'users_identifiant_unique');
            });
        }

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE users MODIFY nom VARCHAR(255) NOT NULL');
            DB::statement('ALTER TABLE users MODIFY identifiant VARCHAR(255) NOT NULL');
        }
    }

    public function down(): void
    {
        if ($this->hasIndex('users', 'users_identifiant_unique')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropUnique('users_identifiant_unique');
            });
        }

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'identifiant')) {
                $table->dropColumn('identifiant');
            }

            if (Schema::hasColumn('users', 'prenom')) {
                $table->dropColumn('prenom');
            }

            if (Schema::hasColumn('users', 'nom')) {
                $table->dropColumn('nom');
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return collect(Schema::getIndexes($table))
                ->contains(fn (array $row): bool => ($row['name'] ?? null) === $index);
        }

        return collect(DB::select("SHOW INDEX FROM {$table}"))
            ->contains(fn (object $row): bool => $row->Key_name === $index);
    }
};
